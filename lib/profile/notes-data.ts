import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/admin";
import {
  type NoteItemMeta,
  type NoteItemType,
  type NoteRecord,
  isNoteItemType,
} from "@/types/notes";

function tsToIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function normalizeMeta(raw: unknown): NoteItemMeta {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    title: typeof r.title === "string" ? r.title : "",
    subtitle: typeof r.subtitle === "string" ? r.subtitle : null,
    href: typeof r.href === "string" ? r.href : "/",
    arabic: typeof r.arabic === "string" ? r.arabic : null,
    locale: typeof r.locale === "string" ? r.locale : null,
  };
}

function normalizeNote(id: string, raw: Record<string, unknown>): NoteRecord | null {
  const itemType = raw.itemType;
  const itemId = raw.itemId;
  const text = raw.text;
  if (!isNoteItemType(itemType)) return null;
  if (typeof itemId !== "string" || !itemId) return null;
  if (typeof text !== "string") return null;
  const createdAt = tsToIso(raw.createdAt);
  const updatedAt = tsToIso(raw.updatedAt ?? raw.createdAt);
  return {
    id,
    itemType,
    itemId,
    text,
    itemMeta: normalizeMeta(raw.itemMeta),
    createdAt,
    updatedAt,
  };
}

export async function listNotes(
  uid: string,
  opts: { itemType?: NoteItemType; limit?: number } = {},
): Promise<NoteRecord[]> {
  const db = getDb();
  if (!db) return [];
  const col = db.collection("users").doc(uid).collection("notes");
  const limit = opts.limit ?? 100;
  try {
    if (opts.itemType) {
      // Filter-only query (no orderBy) so we don't need a composite
      // (itemType, updatedAt) index — same approach as listFavorites.
      const snap = await col.where("itemType", "==", opts.itemType).limit(limit).get();
      const records = snap.docs
        .map((d) => normalizeNote(d.id, d.data() as Record<string, unknown>))
        .filter((n): n is NoteRecord => n !== null);
      records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      return records;
    }
    const snap = await col.orderBy("updatedAt", "desc").limit(limit).get();
    return snap.docs
      .map((d) => normalizeNote(d.id, d.data() as Record<string, unknown>))
      .filter((n): n is NoteRecord => n !== null);
  } catch (err) {
    console.warn("[profile/notes-data] listNotes failed:", err);
    return [];
  }
}

export interface NoteSeed {
  id: string;
  text: string;
  updatedAt: string;
}

/**
 * Returns a map of itemId -> {id, text, updatedAt} for the user's notes of a
 * given type. Used by content list pages (surah, hadith book) to seed initial
 * note state without N+1 queries.
 */
export async function getNotesByItemType(
  uid: string,
  itemType: NoteItemType,
): Promise<Map<string, NoteSeed>> {
  const db = getDb();
  const out = new Map<string, NoteSeed>();
  if (!db) return out;
  try {
    const snap = await db
      .collection("users")
      .doc(uid)
      .collection("notes")
      .where("itemType", "==", itemType)
      .get();
    for (const doc of snap.docs) {
      const data = doc.data() as Record<string, unknown>;
      const itemId = data.itemId;
      const text = data.text;
      if (typeof itemId !== "string") continue;
      if (typeof text !== "string") continue;
      out.set(itemId, {
        id: doc.id,
        text,
        updatedAt: tsToIso(data.updatedAt ?? data.createdAt),
      });
    }
    return out;
  } catch (err) {
    console.warn("[profile/notes-data] getNotesByItemType failed:", err);
    return out;
  }
}

export async function getNoteForItem(
  uid: string,
  itemType: NoteItemType,
  itemId: string,
): Promise<NoteRecord | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const snap = await db
      .collection("users")
      .doc(uid)
      .collection("notes")
      .where("itemType", "==", itemType)
      .where("itemId", "==", itemId)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0]!;
    return normalizeNote(doc.id, doc.data() as Record<string, unknown>);
  } catch (err) {
    console.warn("[profile/notes-data] getNoteForItem failed:", err);
    return null;
  }
}
