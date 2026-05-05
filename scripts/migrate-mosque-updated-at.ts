/**
 * One-shot migration: backfill `updatedAt` on every mosque doc that's
 * missing it. Without this field, the admin list query at
 * lib/admin/data/mosques.ts (`orderBy("updatedAt", "desc")`) silently
 * excludes the doc — so mosques visible on the public site can be
 * invisible in /admin/mosques.
 *
 * Sets `updatedAt = createdAt` when a `createdAt` exists; otherwise uses
 * the current server time. Idempotent — re-runs skip docs that already
 * have an `updatedAt` set.
 *
 * Run:
 *   npm run migrate:mosque-updated-at -- --dry-run   (preview only)
 *   npm run migrate:mosque-updated-at                (write)
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";
import {
  getFirestore,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";

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

type Counts = {
  scanned: number;
  alreadyOk: number;
  patchedFromCreatedAt: number;
  patchedFromNow: number;
};

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(
    `migrate-mosque-updated-at (${dryRun ? "DRY RUN" : "WRITE"}) — project=${process.env.FIREBASE_PROJECT_ID} db=${process.env.FIREBASE_DATABASE_ID ?? "main"}`,
  );

  const firestore = db();
  const counts: Counts = {
    scanned: 0,
    alreadyOk: 0,
    patchedFromCreatedAt: 0,
    patchedFromNow: 0,
  };

  const snap = await firestore.collection(COLLECTION).get();
  let batch = firestore.batch();
  let pendingWrites = 0;

  for (const doc of snap.docs) {
    counts.scanned++;
    const data = doc.data() as { updatedAt?: unknown; createdAt?: unknown };

    if (data.updatedAt) {
      counts.alreadyOk++;
      continue;
    }

    const fallback =
      data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now();
    if (data.createdAt instanceof Timestamp) {
      counts.patchedFromCreatedAt++;
    } else {
      counts.patchedFromNow++;
    }

    if (!dryRun) {
      batch.update(doc.ref, { updatedAt: fallback });
      pendingWrites++;
      if (pendingWrites >= WRITE_BATCH) {
        await batch.commit();
        batch = firestore.batch();
        pendingWrites = 0;
      }
    }
  }

  if (!dryRun && pendingWrites > 0) {
    await batch.commit();
  }

  console.log(
    `scanned=${counts.scanned} alreadyOk=${counts.alreadyOk} patchedFromCreatedAt=${counts.patchedFromCreatedAt} patchedFromNow=${counts.patchedFromNow}`,
  );
  if (dryRun) console.log("(Dry run — nothing was written.)");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
