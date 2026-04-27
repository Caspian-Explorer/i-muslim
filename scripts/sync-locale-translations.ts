/**
 * Mirror activated reserved UI locales' translation docs to the current
 * `messages/<base>.json` shape.
 *
 * Run: npm run sync:locales
 *
 * For each activated locale doc at `config/uiLocales/locales/{code}`:
 *   - Add missing keys with the base locale's value as a placeholder so the
 *     locale stops falling back partial-English at runtime — the placeholder
 *     itself is rendered, which gives the admin a visible "needs translation"
 *     signal during normal browsing.
 *   - Remove keys that no longer exist in the base (avoids stale accumulation).
 *   - Leave already-translated values untouched.
 *
 * Idempotent. No writes happen if the patched object equals the existing one.
 *
 * The script reads message JSON files synchronously from disk so the admin
 * doesn't need to bundle them — it runs in node directly via tsx.
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";
import {
  Timestamp,
  getFirestore,
  type Firestore,
} from "firebase-admin/firestore";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

type Json = unknown;
type JsonObject = Record<string, Json>;

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

function loadBundled(code: string): JsonObject {
  const path = resolve(process.cwd(), "messages", `${code}.json`);
  if (!existsSync(path)) {
    throw new Error(`messages/${code}.json not found`);
  }
  return JSON.parse(readFileSync(path, "utf8")) as JsonObject;
}

function isPlainObject(v: Json): v is JsonObject {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

type Counts = { added: number; removed: number; preserved: number };

function emptyCounts(): Counts {
  return { added: 0, removed: 0, preserved: 0 };
}

// Walk `base` and produce a patched object shaped like `base` but with values
// from `overlay` where they exist. Missing keys → base value. Keys present in
// `overlay` but not in `base` → dropped. Mutates `counts` for diagnostics.
function reshape(base: Json, overlay: Json | undefined, counts: Counts): Json {
  if (isPlainObject(base)) {
    const out: JsonObject = {};
    const overlayObj = isPlainObject(overlay) ? overlay : undefined;

    if (overlayObj) {
      for (const k of Object.keys(overlayObj)) {
        if (!(k in base)) counts.removed++;
      }
    }

    for (const k of Object.keys(base)) {
      const baseVal = base[k];
      const overlayVal = overlayObj ? overlayObj[k] : undefined;
      if (overlayVal === undefined) {
        // Whole subtree missing in overlay → counts every leaf in base.
        countAdded(baseVal, counts);
        out[k] = baseVal;
      } else {
        out[k] = reshape(baseVal, overlayVal, counts);
      }
    }
    return out;
  }

  // Leaf. base is a string/number/boolean/null. Use overlay if present,
  // otherwise fall back to base (placeholder).
  if (overlay === undefined) {
    counts.added++;
    return base;
  }
  // Overlay present and base is a leaf: prefer overlay.
  counts.preserved++;
  return overlay;
}

function countAdded(value: Json, counts: Counts): void {
  if (isPlainObject(value)) {
    for (const v of Object.values(value)) countAdded(v, counts);
  } else {
    counts.added++;
  }
}

function deepEqual(a: Json, b: Json): boolean {
  if (a === b) return true;
  if (isPlainObject(a) && isPlainObject(b)) {
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    for (const k of ak) {
      if (!(k in b)) return false;
      if (!deepEqual(a[k], b[k])) return false;
    }
    return true;
  }
  return false;
}

async function main() {
  const firestore = db();
  console.log(
    `Connecting to Firestore project=${process.env.FIREBASE_PROJECT_ID} db=${process.env.FIREBASE_DATABASE_ID ?? "main"}`,
  );

  const localesCol = firestore
    .collection("config")
    .doc("uiLocales")
    .collection("locales");
  const snap = await localesCol.get();
  const activated = snap.docs.filter((d) => d.data()?.activated === true);

  if (activated.length === 0) {
    console.log("No activated reserved locales — nothing to sync.");
    return;
  }
  console.log(
    `Found ${activated.length} activated locale${activated.length === 1 ? "" : "s"}: ${activated.map((d) => d.id).join(", ")}`,
  );

  // Cache base JSONs since multiple locales likely share `en` as their base.
  const baseCache = new Map<string, JsonObject>();
  function getBase(code: string): JsonObject {
    let m = baseCache.get(code);
    if (!m) {
      m = loadBundled(code);
      baseCache.set(code, m);
    }
    return m;
  }

  let touched = 0;
  for (const doc of activated) {
    const code = doc.id;
    const data = doc.data() ?? {};
    const baseLocale =
      typeof data.baseLocale === "string" && data.baseLocale.length > 0
        ? data.baseLocale
        : "en";
    let base: JsonObject;
    try {
      base = getBase(baseLocale);
    } catch (err) {
      console.warn(
        `[${code}] base locale "${baseLocale}" not found on disk — skipping. (${(err as Error).message})`,
      );
      continue;
    }

    const overlay = isPlainObject(data.messages) ? (data.messages as JsonObject) : {};
    const counts = emptyCounts();
    const patched = reshape(base, overlay, counts) as JsonObject;

    if (deepEqual(patched, overlay)) {
      console.log(`[${code}] up to date (${counts.preserved} preserved).`);
      continue;
    }

    await localesCol.doc(code).set(
      {
        messages: patched,
        syncedAt: Timestamp.now(),
      },
      { merge: true },
    );
    touched++;
    console.log(
      `[${code}] synced — added ${counts.added}, removed ${counts.removed}, preserved ${counts.preserved}.`,
    );
  }

  console.log(
    touched === 0
      ? "Done. Nothing to write."
      : `Done. Wrote ${touched} locale doc${touched === 1 ? "" : "s"}.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
