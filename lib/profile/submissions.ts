import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/admin";
import {
  BUSINESS_SUBMISSIONS_COLLECTION,
} from "@/lib/businesses/constants";
import { MOSQUE_SUBMISSIONS_COLLECTION } from "@/lib/mosques/constants";

export type SubmissionEntity = "event" | "business" | "mosque";

export type EventSubmissionStatus = "under_review" | "draft" | "published" | "cancelled";
export type BusinessSubmissionStatus = "pending_review" | "approved" | "rejected";
export type MosqueSubmissionStatus = "pending_review" | "approved" | "rejected";

export interface MySubmission {
  id: string;
  entity: SubmissionEntity;
  /** What to show as the row title — e.g. event title, business name, mosque English name. */
  title: string;
  /** Generic submitter-status label key — `under_review` | `pending_review` | `published` | `approved` | `rejected` | `cancelled` | `draft`. */
  status: EventSubmissionStatus | BusinessSubmissionStatus;
  submittedAt: string;
  /** Optional public URL for the live record (only when published/approved + a target slug/id is known). */
  liveUrl: string | null;
  /** Short subtitle — e.g. event date, business city, mosque city. */
  subtitle: string | null;
}

export interface MySubmissionsBundle {
  events: MySubmission[];
  businesses: MySubmission[];
  mosques: MySubmission[];
}

function tsToIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function normalizeEvent(id: string, raw: Record<string, unknown>): MySubmission | null {
  const title = asString(raw.title);
  if (!title) return null;
  const statusRaw = asString(raw.status);
  const status: EventSubmissionStatus =
    statusRaw === "under_review" ||
    statusRaw === "draft" ||
    statusRaw === "published" ||
    statusRaw === "cancelled"
      ? statusRaw
      : "under_review";
  const startsAt = raw.startsAt ? tsToIso(raw.startsAt) : null;
  const liveUrl = status === "published" ? `/events/${id}` : null;
  return {
    id,
    entity: "event",
    title,
    status,
    submittedAt: tsToIso(raw.createdAt),
    liveUrl,
    subtitle: startsAt ? new Date(startsAt).toLocaleDateString() : null,
  };
}

function normalizeBusinessSubmission(
  id: string,
  raw: Record<string, unknown>,
): MySubmission | null {
  const payload = (raw.payload ?? {}) as Record<string, unknown>;
  const title = asString(payload.name);
  if (!title) return null;
  const statusRaw = asString(raw.status);
  const status: BusinessSubmissionStatus =
    statusRaw === "approved" || statusRaw === "rejected" ? statusRaw : "pending_review";
  const promotedId = asString(raw.promotedBusinessId, "");
  // Public listing URL needs a slug, which the submission doc may not carry
  // until promotion. Only link out when we have a known live record.
  const liveUrl = status === "approved" && promotedId ? `/businesses/${promotedId}` : null;
  const city = asString(payload.city, "");
  const country = asString(payload.countryCode, "");
  const subtitle = [city, country].filter(Boolean).join(", ") || null;
  return {
    id,
    entity: "business",
    title,
    status,
    submittedAt: tsToIso(raw.createdAt),
    liveUrl,
    subtitle,
  };
}

function normalizeMosqueSubmission(
  id: string,
  raw: Record<string, unknown>,
): MySubmission | null {
  const payload = (raw.payload ?? {}) as Record<string, unknown>;
  const nameField = payload.name;
  const title =
    typeof nameField === "string"
      ? nameField
      : nameField && typeof nameField === "object"
        ? asString((nameField as Record<string, unknown>).en) ||
          asString((nameField as Record<string, unknown>).ar)
        : "";
  if (!title) return null;
  const statusRaw = asString(raw.status);
  const status: MosqueSubmissionStatus =
    statusRaw === "approved" || statusRaw === "rejected" ? statusRaw : "pending_review";
  const promotedSlug = asString(raw.promotedMosqueSlug, "");
  const liveUrl = status === "approved" && promotedSlug ? `/mosques/${promotedSlug}` : null;
  const city = asString(payload.city, "");
  const country = asString(payload.country, "");
  const subtitle = [city, country].filter(Boolean).join(", ") || null;
  return {
    id,
    entity: "mosque",
    title,
    status,
    submittedAt: tsToIso(raw.createdAt),
    liveUrl,
    subtitle,
  };
}

/**
 * Lists submissions made by the current user across events / businesses / mosques.
 *
 * - Events live in the unified `events` collection; we filter by `submittedBy.uid`
 *   so admin-created drafts (no submittedBy) don't leak in.
 * - Business and mosque submissions live in their own moderation collections.
 * - Mosque submissions are tracked by `submittedBy.email` only (the public form
 *   isn't auth-gated), so the email match is the best identifier we have.
 */
export async function listMySubmissions(
  uid: string,
  email: string,
): Promise<MySubmissionsBundle> {
  const db = getDb();
  if (!db) return { events: [], businesses: [], mosques: [] };

  const [eventsSnap, businessesSnap, mosquesSnap] = await Promise.all([
    db.collection("events").where("submittedBy.uid", "==", uid).limit(100).get().catch((err) => {
      console.warn("[profile/submissions] events query failed:", err);
      return null;
    }),
    db
      .collection(BUSINESS_SUBMISSIONS_COLLECTION)
      .where("submittedBy.uid", "==", uid)
      .limit(100)
      .get()
      .catch((err) => {
        console.warn("[profile/submissions] business submissions query failed:", err);
        return null;
      }),
    db
      .collection(MOSQUE_SUBMISSIONS_COLLECTION)
      .where("submittedBy.email", "==", email)
      .limit(100)
      .get()
      .catch((err) => {
        console.warn("[profile/submissions] mosque submissions query failed:", err);
        return null;
      }),
  ]);

  const events: MySubmission[] = eventsSnap
    ? eventsSnap.docs
        .map((d) => normalizeEvent(d.id, d.data() as Record<string, unknown>))
        .filter((s): s is MySubmission => s !== null)
    : [];

  const businesses: MySubmission[] = businessesSnap
    ? businessesSnap.docs
        .map((d) => normalizeBusinessSubmission(d.id, d.data() as Record<string, unknown>))
        .filter((s): s is MySubmission => s !== null)
    : [];

  const mosques: MySubmission[] = mosquesSnap
    ? mosquesSnap.docs
        .map((d) => normalizeMosqueSubmission(d.id, d.data() as Record<string, unknown>))
        .filter((s): s is MySubmission => s !== null)
    : [];

  // Newest first — Firestore queries above don't orderBy because that would
  // require a composite index alongside the `submittedBy.*` filter. List sizes
  // are bounded by the 5/day rate limit so in-memory sort is cheap.
  const byNewest = (a: MySubmission, b: MySubmission) =>
    b.submittedAt.localeCompare(a.submittedAt);
  events.sort(byNewest);
  businesses.sort(byNewest);
  mosques.sort(byNewest);

  return { events, businesses, mosques };
}
