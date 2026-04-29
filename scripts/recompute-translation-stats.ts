/**
 * Iterate every doc in `quran_ayahs` and `hadith_entries`, count per-language
 * non-empty translations, and write the totals to `config/translationStats`.
 *
 * Run: npm run recompute:translation-stats
 *
 * Why a doc instead of live `where(..., ">", "").count()` queries:
 *  - Firestore needs explicit single-field indexes for range queries on map
 *    sub-fields (`translations.<lang>`). Without them, the count fails and
 *    silently returns 0 to the Settings page. A pre-aggregated doc sidesteps
 *    the index dance entirely — one read on page load, no index management.
 *  - Each seed script ALSO calls `recompute()` at the end, so stats are
 *    always fresh after `seed:quran:lang -- --lang=tr` etc.
 *
 * Idempotent. Safe to run repeatedly.
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";
import {
  Timestamp,
  getFirestore,
  type Firestore,
} from "firebase-admin/firestore";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

const QURAN_COLLECTION = "quran_ayahs";
const HADITH_COLLECTION = "hadith_entries";
const STATS_COLLECTION = "config";
const STATS_DOC = "translationStats";

export type LangCounts = Record<string, number>;

export type ContentTranslationStatsDoc = {
  quran: { total: number; perLang: LangCounts };
  hadith: {
    total: number;
    perLang: LangCounts;
    perCollection: Record<string, { total: number; perLang: LangCounts }>;
  };
  updatedAt: Timestamp;
};

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env var: ${name} (check .env.local)`);
    process.exit(1);
  }
  return v;
}

function db(): Firestore {
  if (!getApps().length) {
    const projectId = required("FIREBASE_PROJECT_ID");
    const clientEmail = required("FIREBASE_CLIENT_EMAIL");
    const privateKey = required("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }
  return getFirestore(getApp(), process.env.FIREBASE_DATABASE_ID ?? "main");
}

function tallyTranslations(translations: unknown, into: LangCounts): void {
  if (!translations || typeof translations !== "object") return;
  for (const [lang, value] of Object.entries(
    translations as Record<string, unknown>,
  )) {
    if (typeof value === "string" && value.trim().length > 0) {
      into[lang] = (into[lang] ?? 0) + 1;
    }
  }
}

async function tallyQuran(firestore: Firestore): Promise<{
  total: number;
  perLang: LangCounts;
}> {
  const perLang: LangCounts = {};
  let total = 0;
  // We deliberately fetch the whole collection in pages to avoid OOM on huge
  // datasets. Firestore admin SDK streams via `.stream()` for large reads.
  const stream = firestore.collection(QURAN_COLLECTION).stream();
  for await (const docSnap of stream as AsyncIterable<FirebaseFirestore.QueryDocumentSnapshot>) {
    total++;
    const data = docSnap.data();
    // Arabic is the original — text_ar is the source of truth, not under
    // `translations.ar`. Count it as fully covered.
    if (typeof data.text_ar === "string" && data.text_ar.trim().length > 0) {
      perLang.ar = (perLang.ar ?? 0) + 1;
    }
    tallyTranslations(data.translations, perLang);
  }
  return { total, perLang };
}

async function tallyHadith(firestore: Firestore): Promise<{
  total: number;
  perLang: LangCounts;
  perCollection: Record<string, { total: number; perLang: LangCounts }>;
}> {
  const globalPerLang: LangCounts = {};
  const perCollection: Record<
    string,
    { total: number; perLang: LangCounts }
  > = {};
  let total = 0;
  const stream = firestore.collection(HADITH_COLLECTION).stream();
  for await (const docSnap of stream as AsyncIterable<FirebaseFirestore.QueryDocumentSnapshot>) {
    total++;
    const data = docSnap.data();
    const collection =
      typeof data.collection === "string" && data.collection.length > 0
        ? data.collection
        : "_unknown";
    if (!perCollection[collection]) {
      perCollection[collection] = { total: 0, perLang: {} };
    }
    const bucket = perCollection[collection];
    bucket.total++;
    if (typeof data.text_ar === "string" && data.text_ar.trim().length > 0) {
      globalPerLang.ar = (globalPerLang.ar ?? 0) + 1;
      bucket.perLang.ar = (bucket.perLang.ar ?? 0) + 1;
    }
    tallyTranslations(data.translations, globalPerLang);
    tallyTranslations(data.translations, bucket.perLang);
  }
  return { total, perLang: globalPerLang, perCollection };
}

export async function recomputeTranslationStats(firestore: Firestore): Promise<void> {
  console.log("[stats] tallying Quran translations…");
  const quran = await tallyQuran(firestore);
  console.log(
    `[stats] Quran: total=${quran.total}, perLang=${JSON.stringify(quran.perLang)}`,
  );

  console.log("[stats] tallying Hadith translations…");
  const hadith = await tallyHadith(firestore);
  console.log(
    `[stats] Hadith: total=${hadith.total}, perLang=${JSON.stringify(hadith.perLang)}, collections=${Object.keys(hadith.perCollection).length}`,
  );

  await firestore
    .collection(STATS_COLLECTION)
    .doc(STATS_DOC)
    .set(
      {
        quran,
        hadith,
        updatedAt: Timestamp.now(),
      } satisfies ContentTranslationStatsDoc,
      { merge: false },
    );
  console.log(`[stats] wrote ${STATS_COLLECTION}/${STATS_DOC}.`);
}

async function main(): Promise<void> {
  const firestore = db();
  console.log(
    `Connecting to Firestore project=${process.env.FIREBASE_PROJECT_ID} db=${process.env.FIREBASE_DATABASE_ID ?? "main"}`,
  );
  await recomputeTranslationStats(firestore);
  process.exit(0);
}

// Only auto-run when invoked directly (not when imported by seed scripts).
if (process.argv[1]?.endsWith("recompute-translation-stats.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
