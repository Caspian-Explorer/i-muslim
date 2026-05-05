import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/admin";
import type { EventCategoryDoc } from "@/types/event-category";
import type { LocalizedTextRequired } from "@/types/business";
import { BUNDLED_LOCALES, type BundledLocale } from "@/i18n/config";

type Source = "firestore" | "unavailable";

const COLLECTION = "eventCategories";

interface SeedSpec {
  slug: string;
  name: LocalizedTextRequired;
  sortOrder: number;
}

const SEED: readonly SeedSpec[] = [
  { slug: "prayer", name: { en: "Prayer", ar: "صلاة", tr: "Namaz", id: "Salat" }, sortOrder: 10 },
  { slug: "lecture", name: { en: "Lecture", ar: "محاضرة", tr: "Ders", id: "Kajian" }, sortOrder: 20 },
  { slug: "iftar", name: { en: "Iftar", ar: "إفطار", tr: "İftar", id: "Buka puasa" }, sortOrder: 30 },
  { slug: "janazah", name: { en: "Janazah", ar: "جنازة", tr: "Cenaze", id: "Jenazah" }, sortOrder: 40 },
  { slug: "class", name: { en: "Class", ar: "درس", tr: "Sınıf", id: "Kelas" }, sortOrder: 50 },
  { slug: "fundraiser", name: { en: "Fundraiser", ar: "جمع تبرعات", tr: "Bağış kampanyası", id: "Penggalangan dana" }, sortOrder: 60 },
  { slug: "community", name: { en: "Community", ar: "مجتمعي", tr: "Topluluk", id: "Komunitas" }, sortOrder: 70 },
  { slug: "other", name: { en: "Other", ar: "أخرى", tr: "Diğer", id: "Lainnya" }, sortOrder: 80 },
];

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asOptionalString(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function asLocalizedRequired(raw: unknown, fallback: string): LocalizedTextRequired {
  const r = (raw ?? {}) as Record<string, unknown>;
  const out = {} as LocalizedTextRequired;
  for (const l of BUNDLED_LOCALES as readonly BundledLocale[]) {
    out[l] = typeof r[l] === "string" && (r[l] as string).length > 0 ? (r[l] as string) : fallback;
  }
  return out;
}

function normalizeEventCategory(id: string, raw: Record<string, unknown>): EventCategoryDoc | null {
  const slug = asString(raw.slug);
  if (!slug) return null;
  const sortRaw = typeof raw.sortOrder === "number" ? raw.sortOrder : 0;
  return {
    id,
    slug,
    name: asLocalizedRequired(raw.name, slug),
    iconKey: asOptionalString(raw.iconKey),
    sortOrder: sortRaw,
    isActive: raw.isActive !== false,
  };
}

async function seedDefaults(db: FirebaseFirestore.Firestore): Promise<void> {
  const batch = db.batch();
  for (const spec of SEED) {
    const ref = db.collection(COLLECTION).doc();
    batch.set(ref, {
      slug: spec.slug,
      name: spec.name,
      sortOrder: spec.sortOrder,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
}

export async function fetchEventCategories(): Promise<{
  categories: EventCategoryDoc[];
  source: Source;
}> {
  const db = getDb();
  if (!db) return { categories: [], source: "unavailable" };
  try {
    let snap = await db.collection(COLLECTION).orderBy("sortOrder", "asc").limit(200).get();
    if (snap.empty) {
      await seedDefaults(db);
      snap = await db.collection(COLLECTION).orderBy("sortOrder", "asc").limit(200).get();
    }
    const categories = snap.docs
      .map((d) => normalizeEventCategory(d.id, d.data() as Record<string, unknown>))
      .filter((c): c is EventCategoryDoc => c !== null);
    return { categories, source: "firestore" };
  } catch (err) {
    console.warn("[admin/data/event-categories] read failed:", err);
    return { categories: [], source: "unavailable" };
  }
}
