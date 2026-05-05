import "server-only";
import type { Auth, UserRecord } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { getAdminAuth, getDb } from "@/lib/firebase/admin";
import { fetchUpcomingEvents } from "@/lib/admin/data/events";
import {
  CONTACT_MESSAGES_COLLECTION,
  normalizeContactMessage,
} from "@/lib/admin/data/contact-messages";
import { MOSQUES_COLLECTION } from "@/lib/mosques/constants";
import type { ActivityEntry, DashboardData, UpcomingEvent } from "@/types/admin";

const DAY_MS = 24 * 60 * 60 * 1000;

function emptyDashboard(): DashboardData {
  const flat14 = new Array(14).fill(0);
  return {
    kpis: {
      totalUsers: { value: 0, delta: 0, sparkline: flat14 },
      activeThisWeek: { value: 0, delta: 0, sparkline: flat14 },
      pendingApprovals: { value: 0, delta: 0, sparkline: flat14 },
      donationsThisMonth: { value: 0, delta: 0, sparkline: flat14 },
    },
    userGrowth: { "30": [], "90": [], "365": [] },
    engagementByContent: [],
    donationBreakdown: [],
    recentActivity: [],
    upcomingEvents: [],
  };
}

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function endOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function dailyBuckets(timestamps: number[], days: number): number[] {
  const out = new Array(days).fill(0);
  const todayStart = startOfDay(new Date()).getTime();
  const firstStart = todayStart - (days - 1) * DAY_MS;
  for (const t of timestamps) {
    if (t < firstStart) continue;
    const idx = Math.floor((t - firstStart) / DAY_MS);
    if (idx >= 0 && idx < days) out[idx]++;
  }
  return out;
}

function dailyCumulativeBuckets(
  timestamps: number[],
  days: number,
): Array<{ date: string; users: number }> {
  const sorted = [...timestamps].sort((a, b) => a - b);
  const out: Array<{ date: string; users: number }> = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const day = endOfDay(new Date(now.getTime() - i * DAY_MS));
    const cutoff = day.getTime();
    let count = 0;
    for (const t of sorted) {
      if (t <= cutoff) count++;
      else break;
    }
    out.push({ date: day.toISOString().slice(0, 10), users: count });
  }
  return out;
}

function pctDelta(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 1 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 1000;
}

async function listAllUsers(auth: Auth): Promise<UserRecord[]> {
  const out: UserRecord[] = [];
  let pageToken: string | undefined;
  do {
    const page = await auth.listUsers(1000, pageToken);
    out.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);
  return out;
}

function toMs(raw: unknown): number | null {
  if (!raw) return null;
  if (
    typeof raw === "object" &&
    raw &&
    "toDate" in raw &&
    typeof (raw as { toDate: () => Date }).toDate === "function"
  ) {
    return (raw as { toDate: () => Date }).toDate().getTime();
  }
  if (raw instanceof Date) return raw.getTime();
  if (typeof raw === "string") {
    const n = new Date(raw).getTime();
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

type Donation = { amountUsd: number; category: string; createdAtMs: number };

function readDonation(raw: Record<string, unknown>): Donation | null {
  const amount =
    typeof raw.amount === "number" && Number.isFinite(raw.amount)
      ? raw.amount
      : typeof raw.amountUsd === "number" && Number.isFinite(raw.amountUsd)
        ? raw.amountUsd
        : null;
  if (amount === null) return null;
  const createdAtMs = toMs(raw.createdAt);
  if (createdAtMs === null) return null;
  const category =
    typeof raw.category === "string" && raw.category.length > 0
      ? raw.category
      : "general";
  return { amountUsd: amount, category, createdAtMs };
}

async function fetchRecentDonations(db: Firestore, days: number): Promise<Donation[]> {
  try {
    const since = new Date(Date.now() - days * DAY_MS);
    const snap = await db.collection("donations").where("createdAt", ">=", since).get();
    return snap.docs.flatMap((d) => {
      const donation = readDonation(d.data() as Record<string, unknown>);
      return donation ? [donation] : [];
    });
  } catch (err) {
    console.warn("[admin/data/dashboard] donations read failed:", err);
    return [];
  }
}

type ActivitySource = ActivityEntry & { createdAtMs: number };

async function fetchContactActivity(db: Firestore, limit: number): Promise<ActivitySource[]> {
  try {
    const snap = await db
      .collection(CONTACT_MESSAGES_COLLECTION)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    return snap.docs.flatMap((d) => {
      const m = normalizeContactMessage(d.id, d.data() as Record<string, unknown>);
      if (!m) return [];
      const createdAtMs = new Date(m.createdAt).getTime();
      return [
        {
          id: `contact:${m.id}`,
          actor: m.name,
          actorAvatarUrl: null,
          action: "sent a message",
          target: `“${m.subject}”`,
          createdAt: m.createdAt,
          createdAtMs,
        },
      ];
    });
  } catch (err) {
    console.warn("[admin/data/dashboard] contact activity read failed:", err);
    return [];
  }
}

async function fetchEventActivity(db: Firestore, limit: number): Promise<ActivitySource[]> {
  try {
    const snap = await db
      .collection("events")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    return snap.docs.flatMap((d) => {
      const data = d.data() as Record<string, unknown>;
      const ms = toMs(data.createdAt);
      if (ms === null) return [];
      const titleObj = (data.title ?? {}) as Record<string, unknown>;
      const title = typeof titleObj.en === "string" ? titleObj.en : "(untitled event)";
      const organizer = (data.organizer ?? {}) as Record<string, unknown>;
      const actor = typeof organizer.name === "string" ? organizer.name : "Admin";
      return [
        {
          id: `event:${d.id}`,
          actor,
          actorAvatarUrl: null,
          action: "added event",
          target: title,
          createdAt: new Date(ms).toISOString(),
          createdAtMs: ms,
        },
      ];
    });
  } catch (err) {
    console.warn("[admin/data/dashboard] event activity read failed:", err);
    return [];
  }
}

async function fetchMosqueSubmissionActivity(
  db: Firestore,
  limit: number,
): Promise<ActivitySource[]> {
  try {
    // After the mosqueSubmissions → mosques collection unification,
    // user-submitted-but-not-yet-reviewed mosques live in the same
    // collection as admin-created ones, distinguished by status.
    const snap = await db
      .collection(MOSQUES_COLLECTION)
      .where("status", "==", "pending_review")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    return snap.docs.flatMap((d) => {
      const data = d.data() as Record<string, unknown>;
      const ms = toMs(data.createdAt);
      if (ms === null) return [];
      const submitter = (data.submittedBy ?? {}) as Record<string, unknown>;
      const actor =
        typeof submitter.name === "string" && submitter.name.length > 0
          ? submitter.name
          : typeof submitter.email === "string"
            ? submitter.email
            : "Visitor";
      const nameObj = (data.name ?? {}) as Record<string, unknown>;
      const target = typeof nameObj.en === "string" ? nameObj.en : "a mosque";
      return [
        {
          id: `mosque:${d.id}`,
          actor,
          actorAvatarUrl: null,
          action: "submitted mosque",
          target,
          createdAt: new Date(ms).toISOString(),
          createdAtMs: ms,
        },
      ];
    });
  } catch (err) {
    console.warn("[admin/data/dashboard] mosque submission activity read failed:", err);
    return [];
  }
}

function userSignupActivity(users: UserRecord[], limit: number): ActivitySource[] {
  return [...users]
    .map((u) => ({ user: u, ms: u.metadata.creationTime ? new Date(u.metadata.creationTime).getTime() : NaN }))
    .filter((x) => Number.isFinite(x.ms))
    .sort((a, b) => b.ms - a.ms)
    .slice(0, limit)
    .map(({ user, ms }) => {
      const name =
        user.displayName ??
        (user.email ? (user.email.split("@")[0] ?? "New user") : "New user");
      return {
        id: `user:${user.uid}`,
        actor: name,
        actorAvatarUrl: user.photoURL ?? null,
        action: "joined",
        target: user.email ?? "",
        createdAt: new Date(ms).toISOString(),
        createdAtMs: ms,
      };
    });
}

async function safeCount(
  db: Firestore,
  collection: string,
  where?: { field: string; value: unknown },
): Promise<number> {
  try {
    const base = db.collection(collection);
    const q = where ? base.where(where.field, "==", where.value) : base;
    const snap = await q.count().get();
    return snap.data().count;
  } catch (err) {
    console.warn(`[admin/data/dashboard] count(${collection}) failed:`, err);
    return 0;
  }
}

async function fetchContentInventory(
  db: Firestore,
): Promise<Array<{ kind: string; value: number }>> {
  const [articles, events, surahs, hadith, duas] = await Promise.all([
    safeCount(db, "articles"),
    safeCount(db, "events", { field: "status", value: "published" }),
    safeCount(db, "quran_surahs"),
    safeCount(db, "hadith_entries"),
    safeCount(db, "duas"),
  ]);
  return [
    { kind: "Articles", value: articles },
    { kind: "Quran", value: surahs },
    { kind: "Hadith", value: hadith },
    { kind: "Du'as", value: duas },
    { kind: "Events", value: events },
  ];
}

export async function fetchDashboard(): Promise<DashboardData> {
  const auth = getAdminAuth();
  const db = getDb();
  if (!auth || !db) {
    console.warn("[admin/data/dashboard] Firebase Admin not configured; returning empty dashboard.");
    return emptyDashboard();
  }

  const now = new Date();
  const oneWeekAgo = now.getTime() - 7 * DAY_MS;
  const twoWeeksAgo = now.getTime() - 14 * DAY_MS;
  const thirtyDaysAgo = now.getTime() - 30 * DAY_MS;
  const sixtyDaysAgo = now.getTime() - 60 * DAY_MS;
  const monthStart = startOfMonth(now).getTime();
  const lastMonthStart = startOfMonth(
    new Date(now.getFullYear(), now.getMonth() - 1, 1),
  ).getTime();

  const [
    users,
    donations,
    pendingSnap,
    contentInventory,
    contactAct,
    eventAct,
    mosqueAct,
    upcomingEvents,
  ] = await Promise.all([
    listAllUsers(auth).catch((err) => {
      console.warn("[admin/data/dashboard] listAllUsers failed:", err);
      return [] as UserRecord[];
    }),
    fetchRecentDonations(db, 60),
    db
      .collection("users")
      .where("status", "==", "pending")
      .count()
      .get()
      .catch((err) => {
        console.warn("[admin/data/dashboard] pending count failed:", err);
        return null;
      }),
    fetchContentInventory(db),
    fetchContactActivity(db, 5),
    fetchEventActivity(db, 5),
    fetchMosqueSubmissionActivity(db, 5),
    fetchUpcomingEvents(14, 6).catch((err) => {
      console.warn("[admin/data/dashboard] upcoming events failed:", err);
      return [] as UpcomingEvent[];
    }),
  ]);

  const creationMs = users
    .map((u) => (u.metadata.creationTime ? new Date(u.metadata.creationTime).getTime() : NaN))
    .filter((n) => Number.isFinite(n));
  const lastSignInMs = users
    .map((u) => (u.metadata.lastSignInTime ? new Date(u.metadata.lastSignInTime).getTime() : NaN))
    .filter((n) => Number.isFinite(n));

  const totalUsers = users.length;
  const activeThisWeek = lastSignInMs.filter((t) => t >= oneWeekAgo).length;
  const activePrevWeek = lastSignInMs.filter(
    (t) => t >= twoWeeksAgo && t < oneWeekAgo,
  ).length;
  const signupsLast30 = creationMs.filter((t) => t >= thirtyDaysAgo).length;
  const signupsPrev30 = creationMs.filter(
    (t) => t >= sixtyDaysAgo && t < thirtyDaysAgo,
  ).length;

  const donationsThisMonth = donations
    .filter((d) => d.createdAtMs >= monthStart)
    .reduce((s, d) => s + d.amountUsd, 0);
  const donationsLastMonth = donations
    .filter((d) => d.createdAtMs >= lastMonthStart && d.createdAtMs < monthStart)
    .reduce((s, d) => s + d.amountUsd, 0);

  const breakdownMap = new Map<string, number>();
  for (const d of donations) {
    if (d.createdAtMs < monthStart) continue;
    breakdownMap.set(d.category, (breakdownMap.get(d.category) ?? 0) + d.amountUsd);
  }
  const donationBreakdown = Array.from(breakdownMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category, value]) => ({ category, value }));

  const donationSparkline = new Array(14).fill(0) as number[];
  {
    const todayStart = startOfDay(now).getTime();
    const firstStart = todayStart - 13 * DAY_MS;
    for (const d of donations) {
      if (d.createdAtMs < firstStart) continue;
      const idx = Math.floor((d.createdAtMs - firstStart) / DAY_MS);
      if (idx >= 0 && idx < 14) donationSparkline[idx] += d.amountUsd;
    }
  }

  const merged: ActivitySource[] = [
    ...userSignupActivity(users, 5),
    ...contactAct,
    ...eventAct,
    ...mosqueAct,
  ];
  const recentActivity: ActivityEntry[] = merged
    .sort((a, b) => b.createdAtMs - a.createdAtMs)
    .slice(0, 5)
    .map((src) => ({
      id: src.id,
      actor: src.actor,
      actorAvatarUrl: src.actorAvatarUrl,
      action: src.action,
      target: src.target,
      createdAt: src.createdAt,
    }));

  return {
    kpis: {
      totalUsers: {
        value: totalUsers,
        delta: pctDelta(signupsLast30, signupsPrev30),
        sparkline: dailyBuckets(creationMs, 14),
      },
      activeThisWeek: {
        value: activeThisWeek,
        delta: pctDelta(activeThisWeek, activePrevWeek),
        sparkline: dailyBuckets(lastSignInMs, 14),
      },
      pendingApprovals: {
        value: pendingSnap?.data().count ?? 0,
        delta: 0,
        sparkline: new Array(14).fill(0),
      },
      donationsThisMonth: {
        value: donationsThisMonth,
        delta: pctDelta(donationsThisMonth, donationsLastMonth),
        sparkline: donationSparkline,
      },
    },
    userGrowth: {
      "30": dailyCumulativeBuckets(creationMs, 30),
      "90": dailyCumulativeBuckets(creationMs, 90),
      "365": dailyCumulativeBuckets(creationMs, 365),
    },
    engagementByContent: contentInventory,
    donationBreakdown,
    recentActivity,
    upcomingEvents,
  };
}
