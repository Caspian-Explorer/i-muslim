import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/admin";
import { MOCK_NOTIFICATIONS } from "@/lib/admin/mock/notifications";
import type { AdminNotification, NotificationType } from "@/types/admin";

export const NOTIFICATIONS_COLLECTION = "notifications";

const TYPES: NotificationType[] = [
  "signup",
  "flagged",
  "donation",
  "qa",
  "system",
  "submission",
  "contact",
];

function asIso(v: unknown): string {
  if (!v) return new Date().toISOString();
  if (typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString();
  if (
    typeof v === "object" &&
    v &&
    "toDate" in v &&
    typeof (v as { toDate: () => Date }).toDate === "function"
  ) {
    return (v as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asOptionalString(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export function normalizeNotification(
  id: string,
  raw: Record<string, unknown>,
): AdminNotification | null {
  if (!raw) return null;
  const title = asString(raw.title);
  if (!title) return null;
  const typeRaw = typeof raw.type === "string" ? raw.type : "system";
  const type: NotificationType = TYPES.includes(typeRaw as NotificationType)
    ? (typeRaw as NotificationType)
    : "system";
  return {
    id,
    type,
    title,
    body: asString(raw.body),
    createdAt: asIso(raw.createdAt),
    read: raw.read === true,
    link: asOptionalString(raw.link),
  };
}

export type NotificationsResult = {
  items: AdminNotification[];
  source: "firestore" | "mock";
};

export async function fetchNotifications(
  { limit = 50 }: { limit?: number } = {},
): Promise<NotificationsResult> {
  const db = getDb();
  if (!db) return { items: MOCK_NOTIFICATIONS, source: "mock" };
  try {
    const snap = await db
      .collection(NOTIFICATIONS_COLLECTION)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    if (snap.empty) return { items: [], source: "firestore" };
    const items = snap.docs
      .map((d) => normalizeNotification(d.id, d.data() as Record<string, unknown>))
      .filter((n): n is AdminNotification => n !== null);
    return { items, source: "firestore" };
  } catch (err) {
    console.warn("[admin/data/notifications] read failed:", err);
    return { items: MOCK_NOTIFICATIONS, source: "mock" };
  }
}

export type CreateNotificationInput = {
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  sourceCollection?: string;
  sourceId?: string;
};

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    const doc: Record<string, unknown> = {
      type: input.type,
      title: input.title,
      body: input.body,
      read: false,
      createdAt: Timestamp.now(),
    };
    if (input.link) doc.link = input.link;
    if (input.sourceCollection) doc.sourceCollection = input.sourceCollection;
    if (input.sourceId) doc.sourceId = input.sourceId;
    await db.collection(NOTIFICATIONS_COLLECTION).add(doc);
  } catch (err) {
    console.warn("[admin/data/notifications] create failed:", err);
  }
}

export async function markNotificationRead(id: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await db.collection(NOTIFICATIONS_COLLECTION).doc(id).update({
      read: true,
      readAt: Timestamp.now(),
    });
    return true;
  } catch (err) {
    console.warn("[admin/data/notifications] mark read failed:", err);
    return false;
  }
}

export async function markAllNotificationsRead(): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  try {
    const snap = await db
      .collection(NOTIFICATIONS_COLLECTION)
      .where("read", "==", false)
      .limit(500)
      .get();
    if (snap.empty) return 0;
    const batch = db.batch();
    const now = Timestamp.now();
    snap.docs.forEach((d) => batch.update(d.ref, { read: true, readAt: now }));
    await batch.commit();
    return snap.size;
  } catch (err) {
    console.warn("[admin/data/notifications] mark all read failed:", err);
    return 0;
  }
}
