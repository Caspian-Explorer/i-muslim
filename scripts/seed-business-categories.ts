/**
 * Seed Firestore with the curated 13 default business categories.
 *
 * Usage:
 *   npm run seed:business-categories
 *
 * Idempotent: each doc uses its slug as the doc ID, so re-running upserts
 * (no duplicates). Existing admin-edited fields are preserved via { merge: true }.
 *
 * DESTRUCTIVE: any pre-existing category whose slug is NOT in the curated 13
 * is deleted. This wipes admin-created custom categories. Re-run after every
 * such addition or remove the cleanup block.
 *
 * Translations are starter values — edit in /admin/businesses/categories
 * after the seed if you want to refine them.
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";
import {
  FieldValue,
  getFirestore,
  type Firestore,
} from "firebase-admin/firestore";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

const CATEGORIES = [
  { slug: "grocery",         name: { en: "Grocery",         ar: "بقالة",          tr: "Market",        id: "Toko Kelontong" } },
  { slug: "restaurant",      name: { en: "Restaurant",      ar: "مطعم",           tr: "Restoran",      id: "Restoran" } },
  { slug: "butcher",         name: { en: "Butcher",         ar: "جزار",           tr: "Kasap",         id: "Tukang Daging" } },
  { slug: "bakery",          name: { en: "Bakery",          ar: "مخبز",           tr: "Fırın",         id: "Toko Roti" } },
  { slug: "clothing",        name: { en: "Clothing",        ar: "ملابس",          tr: "Giyim",         id: "Pakaian" } },
  { slug: "salon",           name: { en: "Salon",           ar: "صالون",          tr: "Kuaför",        id: "Salon" } },
  { slug: "travel",          name: { en: "Travel",          ar: "سفر",            tr: "Seyahat",       id: "Perjalanan" } },
  { slug: "finance",         name: { en: "Finance",         ar: "مالية",          tr: "Finans",        id: "Keuangan" } },
  { slug: "education",       name: { en: "Education",       ar: "تعليم",          tr: "Eğitim",        id: "Pendidikan" } },
  { slug: "childcare",       name: { en: "Childcare",       ar: "رعاية الأطفال",  tr: "Çocuk Bakımı",  id: "Penitipan Anak" } },
  { slug: "health",          name: { en: "Health",          ar: "صحة",            tr: "Sağlık",        id: "Kesehatan" } },
  { slug: "mosque-services", name: { en: "Mosque services", ar: "خدمات المسجد",   tr: "Cami Hizmetleri", id: "Layanan Masjid" } },
  { slug: "other",           name: { en: "Other",           ar: "أخرى",           tr: "Diğer",         id: "Lainnya" } },
] as const;

function db(): Firestore {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    console.error(
      "Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY in .env.local",
    );
    process.exit(1);
  }
  const app =
    getApps().length === 0
      ? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
      : getApp();
  const databaseId = process.env.FIREBASE_DATABASE_ID || "main";
  return getFirestore(app, databaseId);
}

async function main() {
  const firestore = db();
  const curatedSlugs = new Set<string>(CATEGORIES.map((c) => c.slug));

  const existing = await firestore.collection("categories").get();
  const stale = existing.docs.filter((d) => {
    const slug = (d.data() as { slug?: unknown }).slug;
    return typeof slug !== "string" || !curatedSlugs.has(slug);
  });
  if (stale.length > 0) {
    console.log(`Deleting ${stale.length} non-curated category doc(s):`);
    for (const d of stale) console.log(`  - ${d.id} (slug: ${(d.data() as { slug?: unknown }).slug ?? "<missing>"})`);
    const delBatch = firestore.batch();
    stale.forEach((d) => delBatch.delete(d.ref));
    await delBatch.commit();
  }

  console.log(`Seeding ${CATEGORIES.length} business categories...`);
  const batch = firestore.batch();
  CATEGORIES.forEach((cat, i) => {
    const ref = firestore.collection("categories").doc(cat.slug);
    batch.set(
      ref,
      {
        slug: cat.slug,
        name: cat.name,
        sortOrder: i,
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
  await batch.commit();
  console.log(`Done. ${CATEGORIES.length} categories upserted into 'categories' collection.`);
  console.log("Edit translations or sortOrder in /admin/businesses/categories.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
