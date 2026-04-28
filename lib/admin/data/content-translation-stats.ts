import "server-only";
import { cache } from "react";
import type { Firestore } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/admin";
import { ALL_LANGS, type LangCode } from "@/lib/translations";
import { COLLECTIONS as HADITH_COLLECTIONS } from "@/lib/hadith";

const QURAN_COLLECTION = "quran_ayahs";
const HADITH_COLLECTION = "hadith_entries";

export type LangCountMap = Partial<Record<LangCode, number>>;

export type ContentTranslationStats = {
  quran: { total: number; perLang: LangCountMap };
  hadith: { total: number; perLang: LangCountMap };
};

export type HadithCollectionStats = {
  slug: string;
  total: number;
  translated: number;
};

// Languages we count per collection. Arabic is the original — every doc
// already contains its `text_ar`, so a "translation" % doesn't apply.
const COUNTABLE_LANGS: LangCode[] = ALL_LANGS.filter((l) => l !== "ar");

async function safeCollectionCount(db: Firestore, collection: string): Promise<number> {
  try {
    const snap = await db.collection(collection).count().get();
    return snap.data().count;
  } catch (err) {
    console.warn(`[content-translation-stats] count(${collection}) failed:`, err);
    return 0;
  }
}

async function safeTranslatedCount(
  db: Firestore,
  collection: string,
  lang: LangCode,
  extraWhere?: { field: string; value: unknown },
): Promise<number> {
  try {
    let q: FirebaseFirestore.Query = db.collection(collection);
    if (extraWhere) q = q.where(extraWhere.field, "==", extraWhere.value);
    // ">" "" excludes both absent fields and empty strings (the seed scripts
    // write "" when a translation isn't available), so this counts only docs
    // with real translated text.
    q = q.where(`translations.${lang}`, ">", "");
    const snap = await q.count().get();
    return snap.data().count;
  } catch (err) {
    // Most likely cause: Firestore is missing a single-field or composite
    // index on `translations.<lang>` (or `(collection, translations.<lang>)`
    // for the per-collection variant). We log and return 0 so the page
    // doesn't crash; admin sees 0% and knows to deploy `firestore.indexes.json`.
    console.warn(
      `[content-translation-stats] translated count(${collection}, ${lang}${
        extraWhere ? `, where ${extraWhere.field}=${extraWhere.value}` : ""
      }) failed:`,
      err,
    );
    return 0;
  }
}

async function statsFor(
  db: Firestore,
  collection: string,
): Promise<{ total: number; perLang: LangCountMap }> {
  const [total, ...counts] = await Promise.all([
    safeCollectionCount(db, collection),
    ...COUNTABLE_LANGS.map((lang) => safeTranslatedCount(db, collection, lang)),
  ]);
  const perLang: LangCountMap = {};
  COUNTABLE_LANGS.forEach((lang, i) => {
    perLang[lang] = counts[i] ?? 0;
  });
  return { total, perLang };
}

export const getContentTranslationStats = cache(
  async (): Promise<ContentTranslationStats> => {
    const db = getDb();
    if (!db) {
      return {
        quran: { total: 0, perLang: {} },
        hadith: { total: 0, perLang: {} },
      };
    }
    const [quran, hadith] = await Promise.all([
      statsFor(db, QURAN_COLLECTION),
      statsFor(db, HADITH_COLLECTION),
    ]);
    return { quran, hadith };
  },
);

async function safeCollectionTotalForSlug(
  db: Firestore,
  slug: string,
): Promise<number> {
  try {
    const snap = await db
      .collection(HADITH_COLLECTION)
      .where("collection", "==", slug)
      .count()
      .get();
    return snap.data().count;
  } catch (err) {
    console.warn(
      `[content-translation-stats] total count(${HADITH_COLLECTION}, ${slug}) failed:`,
      err,
    );
    return 0;
  }
}

export const getHadithPerCollectionStats = cache(
  async (lang: LangCode): Promise<HadithCollectionStats[]> => {
    const db = getDb();
    if (!db) return [];
    const slugs = HADITH_COLLECTIONS.map((c) => c.slug);
    const results = await Promise.all(
      slugs.map(async (slug) => {
        const [total, translated] = await Promise.all([
          safeCollectionTotalForSlug(db, slug),
          safeTranslatedCount(db, HADITH_COLLECTION, lang, {
            field: "collection",
            value: slug,
          }),
        ]);
        return { slug, total, translated };
      }),
    );
    return results;
  },
);
