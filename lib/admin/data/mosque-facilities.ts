import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/admin";
import {
  DEFAULT_MOSQUE_FACILITIES,
  MOSQUE_FACILITIES_COLLECTION,
} from "@/lib/mosques/constants";
import type { MosqueFacility } from "@/types/mosque";

type Source = "firestore" | "unavailable";

function normalize(id: string, raw: Record<string, unknown>): MosqueFacility | null {
  const slug = typeof raw.slug === "string" ? raw.slug : null;
  const name = typeof raw.name === "string" ? raw.name : null;
  if (!slug || !name) return null;
  return {
    id,
    slug,
    name,
    iconKey: typeof raw.iconKey === "string" && raw.iconKey.length > 0 ? raw.iconKey : undefined,
    sortOrder: typeof raw.sortOrder === "number" ? raw.sortOrder : 0,
  };
}

async function seedDefaults(db: FirebaseFirestore.Firestore): Promise<MosqueFacility[]> {
  const batch = db.batch();
  const seeded: MosqueFacility[] = [];
  for (const [idx, def] of DEFAULT_MOSQUE_FACILITIES.entries()) {
    const ref = db.collection(MOSQUE_FACILITIES_COLLECTION).doc(def.slug);
    batch.set(ref, {
      slug: def.slug,
      name: def.name,
      iconKey: def.iconKey ?? null,
      sortOrder: idx,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    seeded.push({ id: def.slug, slug: def.slug, name: def.name, iconKey: def.iconKey, sortOrder: idx });
  }
  await batch.commit();
  return seeded;
}

export async function fetchMosqueFacilities(): Promise<{
  facilities: MosqueFacility[];
  source: Source;
}> {
  const db = getDb();
  if (!db) return { facilities: [], source: "unavailable" };
  try {
    const snap = await db
      .collection(MOSQUE_FACILITIES_COLLECTION)
      .orderBy("sortOrder", "asc")
      .limit(200)
      .get();
    if (snap.empty) {
      const seeded = await seedDefaults(db);
      return { facilities: seeded, source: "firestore" };
    }
    const facilities = snap.docs
      .map((d) => normalize(d.id, d.data() as Record<string, unknown>))
      .filter((f): f is MosqueFacility => f !== null);
    return { facilities, source: "firestore" };
  } catch (err) {
    console.warn("[admin/data/mosque-facilities] read failed:", err);
    return { facilities: [], source: "unavailable" };
  }
}
