/**
 * One-shot seed: promote the 30 curated mock mosques in
 * lib/admin/mock/mosques.ts into the real `mosques` Firestore collection
 * with status="published". Until this runs, the public /mosques page
 * shows the mock fallback while admin /admin/mosques shows nothing —
 * see CHANGELOG for the full diagnosis.
 *
 * Idempotent. Default behavior: skip mosques whose slug already exists
 * in Firestore (preserves admin edits). Pass --force to overwrite.
 *
 * Run:
 *   npm run seed:mosques -- --dry-run   (preview only)
 *   npm run seed:mosques                (write missing only)
 *   npm run seed:mosques -- --force     (overwrite all)
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";
import {
  getFirestore,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";
import { MOCK_MOSQUES } from "@/lib/admin/mock/mosques";
import type { Mosque } from "@/types/mosque";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

const COLLECTION = "mosques";
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

// Firestore Admin SDK rejects undefined values in nested objects, so strip
// them before writing. Mirrors the helper used in the createMosque action.
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(stripUndefined) as unknown as T;
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}

function mosqueToFirestoreData(m: Mosque): Record<string, unknown> {
  // The mock builder produces ISO strings for createdAt / updatedAt /
  // publishedAt; Firestore conventionally stores them as Timestamps so
  // that the admin orderBy("updatedAt") works and normalizeMosque on
  // read happily handles either form.
  const data: Record<string, unknown> = {
    ...m,
    createdAt: Timestamp.fromDate(new Date(m.createdAt)),
    updatedAt: Timestamp.fromDate(new Date(m.updatedAt)),
    publishedAt: m.publishedAt
      ? Timestamp.fromDate(new Date(m.publishedAt))
      : undefined,
  };
  return stripUndefined(data);
}

type Counts = {
  scanned: number;
  skippedExisting: number;
  written: number;
};

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const force = process.argv.includes("--force");

  console.log(
    `seed-mosques (${dryRun ? "DRY RUN" : "WRITE"}${force ? ", FORCE" : ""}) — ` +
      `project=${process.env.FIREBASE_PROJECT_ID} ` +
      `db=${process.env.FIREBASE_DATABASE_ID ?? "main"}`,
  );

  const firestore = db();
  const counts: Counts = { scanned: 0, skippedExisting: 0, written: 0 };

  // Pre-fetch existing slugs in one round-trip so we don't .get() per doc.
  const existingSlugs = new Set<string>();
  if (!force) {
    const existing = await firestore.collection(COLLECTION).select().get();
    existing.docs.forEach((d) => existingSlugs.add(d.id));
    console.log(`Found ${existingSlugs.size} existing mosque(s) in Firestore.`);
  }

  let batch = firestore.batch();
  let pendingWrites = 0;

  for (const mosque of MOCK_MOSQUES) {
    counts.scanned++;
    if (!force && existingSlugs.has(mosque.slug)) {
      counts.skippedExisting++;
      continue;
    }

    const ref = firestore.collection(COLLECTION).doc(mosque.slug);
    const data = mosqueToFirestoreData(mosque);

    if (!dryRun) {
      batch.set(ref, data, { merge: false });
      pendingWrites++;
      if (pendingWrites >= WRITE_BATCH) {
        await batch.commit();
        batch = firestore.batch();
        pendingWrites = 0;
      }
    }
    counts.written++;
  }

  if (!dryRun && pendingWrites > 0) {
    await batch.commit();
  }

  console.log(
    `scanned=${counts.scanned} written=${counts.written} skippedExisting=${counts.skippedExisting}`,
  );
  if (dryRun) console.log("(Dry run — nothing was written.)");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
