import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/admin";
import { BUNDLED_LOCALES, type BundledLocale } from "@/i18n/config";
import type { ArticleCategoryDoc } from "@/types/blog";

type Source = "firestore" | "unavailable";

const COLLECTION = "articleCategories";

interface SeedSpec {
  slug: string;
  name: ArticleCategoryDoc["name"];
  sortOrder: number;
}

const SEED: readonly SeedSpec[] = [
  {
    slug: "prayer-times",
    name: { en: "Prayer Times", ar: "أوقات الصلاة", tr: "Namaz Vakitleri", id: "Waktu Shalat" },
    sortOrder: 10,
  },
  {
    slug: "hijri",
    name: { en: "Hijri", ar: "الهجري", tr: "Hicri", id: "Hijriah" },
    sortOrder: 20,
  },
  {
    slug: "quran-hadith",
    name: { en: "Quran & Hadith", ar: "القرآن والحديث", tr: "Kuran ve Hadis", id: "Al-Qur'an & Hadis" },
    sortOrder: 30,
  },
  {
    slug: "qibla",
    name: { en: "Qibla", ar: "القبلة", tr: "Kıble", id: "Kiblat" },
    sortOrder: 40,
  },
];

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asOptionalString(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function asLocalizedRequired(raw: unknown, fallback: string): ArticleCategoryDoc["name"] {
  const r = (raw ?? {}) as Record<string, unknown>;
  const out = {} as ArticleCategoryDoc["name"];
  for (const l of BUNDLED_LOCALES as readonly BundledLocale[]) {
    out[l] = typeof r[l] === "string" && (r[l] as string).length > 0 ? (r[l] as string) : fallback;
  }
  return out;
}

function normalize(id: string, raw: Record<string, unknown>): ArticleCategoryDoc | null {
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

export async function fetchArticleCategories(): Promise<{
  categories: ArticleCategoryDoc[];
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
      .map((d) => normalize(d.id, d.data() as Record<string, unknown>))
      .filter((c): c is ArticleCategoryDoc => c !== null);
    return { categories, source: "firestore" };
  } catch (err) {
    console.warn("[admin/data/article-categories] read failed:", err);
    return { categories: [], source: "unavailable" };
  }
}
