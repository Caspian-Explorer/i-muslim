/**
 * One-shot migration: backfill `publishedTranslations.<lang> = true` for every
 * existing non-empty hadith translation, so when per-language Draft/Published
 * status ships, nothing already-translated disappears from the public site.
 *
 * Idempotent — re-runs skip docs that already cover every translated language.
 *
 * Run:
 *   npm run migrate:hadith-publish-status -- --dry-run   (preview only)
 *   npm run migrate:hadith-publish-status                (write)
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

const WRITE_BATCH = 400;

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

type Counts = {
  scanned: number;
  alreadyComplete: number;
  patched: number;
  noTranslations: number;
};

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(
    `migrate-hadith-publish-status (${dryRun ? "DRY RUN" : "WRITE"}) — project=${process.env.FIREBASE_PROJECT_ID} db=${process.env.FIREBASE_DATABASE_ID ?? "main"}`,
  );

  const firestore = db();
  const counts: Counts = { scanned: 0, alreadyComplete: 0, patched: 0, noTranslations: 0 };

  const snap = await firestore.collection("hadith_entries").get();
  let batch = firestore.batch();
  let pendingWrites = 0;

  for (const doc of snap.docs) {
    counts.scanned++;
    const data = doc.data() as {
      translations?: Record<string, unknown>;
      publishedTranslations?: Record<string, unknown>;
    };
    const translations = data.translations ?? {};
    const existing = data.publishedTranslations ?? {};

    const targetLangs = Object.entries(translations)
      .filter(([, v]) => typeof v === "string" && (v as string).trim().length > 0)
      .map(([k]) => k);

    if (targetLangs.length === 0) {
      counts.noTranslations++;
      continue;
    }

    const missing = targetLangs.filter((lang) => existing[lang] !== true);
    if (missing.length === 0) {
      counts.alreadyComplete++;
      continue;
    }

    const merged: Record<string, boolean> = { ...(existing as Record<string, boolean>) };
    for (const lang of missing) merged[lang] = true;

    if (!dryRun) {
      batch.update(doc.ref, { publishedTranslations: merged });
      pendingWrites++;
      if (pendingWrites >= WRITE_BATCH) {
        await batch.commit();
        batch = firestore.batch();
        pendingWrites = 0;
      }
    }
    counts.patched++;
  }

  if (!dryRun && pendingWrites > 0) {
    await batch.commit();
  }

  console.log(
    `scanned=${counts.scanned} patched=${counts.patched} alreadyComplete=${counts.alreadyComplete} noTranslations=${counts.noTranslations}`,
  );
  if (dryRun) console.log("(Dry run — nothing was written.)");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
