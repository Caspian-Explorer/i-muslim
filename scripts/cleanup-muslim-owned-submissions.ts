/**
 * One-shot: delete any businessSubmissions doc whose payload.halalStatus
 * is the legacy "muslim_owned" enum value. Run after the form change that
 * folded muslim-owned-ness back into the halal radio set, to clear test
 * data that would otherwise be inconsistent with the new model.
 *
 * Usage:
 *   npm run cleanup:muslim-owned-submissions
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

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
  const snap = await firestore.collection("businessSubmissions").get();
  const stale = snap.docs.filter((d) => {
    const payload = (d.data() as { payload?: { halalStatus?: unknown } }).payload;
    return payload?.halalStatus === "muslim_owned";
  });
  if (stale.length === 0) {
    console.log("No businessSubmissions with halalStatus='muslim_owned'. Nothing to delete.");
    return;
  }
  console.log(`Deleting ${stale.length} submission(s):`);
  for (const d of stale) {
    const payload = (d.data() as { payload?: { name?: unknown } }).payload;
    console.log(`  - ${d.id} (name: ${typeof payload?.name === "string" ? payload.name : "<unknown>"})`);
  }
  const batch = firestore.batch();
  stale.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
