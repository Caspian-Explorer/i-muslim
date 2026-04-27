import "server-only";
import { getDb } from "@/lib/firebase/admin";
import { MOCK_EVENTS } from "@/lib/admin/mock/events";
import { normalizeEvent } from "@/lib/admin/data/events";
import { nextOccurrenceAfter, expandEventOccurrences } from "@/lib/admin/recurrence";
import type { AdminEvent } from "@/types/admin";

export interface PublicEventListItem {
  event: AdminEvent;
  nextStartsAt: string;
}

export interface PublicEventsResult {
  events: PublicEventListItem[];
  source: "firestore" | "mock";
}

export async function fetchPublicEvents(opts?: {
  windowDays?: number;
  limit?: number;
}): Promise<PublicEventsResult> {
  const windowDays = opts?.windowDays ?? 60;
  const limit = opts?.limit ?? 100;
  const now = new Date();
  const horizon = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);

  const db = getDb();
  let events: AdminEvent[];
  let source: "firestore" | "mock" = "mock";

  if (db) {
    try {
      const snap = await db
        .collection("events")
        .where("status", "==", "published")
        .limit(500)
        .get();
      events = snap.docs
        .map((d) => normalizeEvent(d.id, d.data() as Record<string, unknown>))
        .filter((e): e is AdminEvent => e !== null);
      source = "firestore";
    } catch (err) {
      console.warn("[events/public] firestore read failed, using mock:", err);
      events = MOCK_EVENTS.filter((e) => e.status === "published");
    }
  } else {
    events = MOCK_EVENTS.filter((e) => e.status === "published");
  }

  const items: PublicEventListItem[] = [];
  for (const event of events) {
    const next = nextOccurrenceAfter(event, now);
    if (!next) continue;
    if (next.getTime() > horizon.getTime()) continue;
    items.push({ event, nextStartsAt: next.toISOString() });
  }
  items.sort((a, b) => new Date(a.nextStartsAt).getTime() - new Date(b.nextStartsAt).getTime());
  return { events: items.slice(0, limit), source };
}

export async function fetchPublicEvent(id: string): Promise<AdminEvent | null> {
  const db = getDb();
  if (db) {
    try {
      const doc = await db.collection("events").doc(id).get();
      if (!doc.exists) return null;
      const event = normalizeEvent(doc.id, doc.data() as Record<string, unknown>);
      return event && event.status === "published" ? event : null;
    } catch (err) {
      console.warn("[events/public] fetchPublicEvent firestore read failed:", err);
      return null;
    }
  }
  return MOCK_EVENTS.find((e) => e.id === id && e.status === "published") ?? null;
}

export function nextThreeOccurrences(event: AdminEvent): Date[] {
  const now = new Date();
  const horizon = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  return expandEventOccurrences(event, now, horizon, 3).map((o) => o.startsAt);
}
