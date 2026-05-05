/**
 * One-shot migration: copy every doc from the legacy `mosqueSubmissions`
 * collection into the unified `mosques` collection, where pending
 * submissions now live as `status: "pending_review"` mosque docs and
 * rejected ones as `status: "rejected"` (with the original reason
 * preserved on `moderation.rejectionReason`).
 *
 * - "pending_review" submission → new mosques doc, status="pending_review"
 * - "rejected" submission       → new mosques doc, status="rejected"
 *                                  with moderation.rejectionReason set
 * - "approved" submission       → SKIP — the corresponding published
 *                                 mosque was already created at promote
 *                                 time (and lives at submission.promotedSlug)
 *
 * Idempotent: each submission picks up a deterministic slug from
 * (name.en, citySlug). If a mosque already exists at that slug, the
 * submission is skipped — re-running this script after a mid-flight
 * abort is safe.
 *
 * Does NOT delete the source `mosqueSubmissions` docs. Keep them around
 * until you've confirmed the unified flow works in admin/mosques, then
 * drop the collection manually from the Firebase console.
 *
 * Run:
 *   npm run migrate:submissions-to-mosques -- --dry-run   (preview only)
 *   npm run migrate:submissions-to-mosques                (write)
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

const SOURCE = "mosqueSubmissions";
const TARGET = "mosques";
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

const RESERVED_PATHS = new Set([
  "submit",
  "near-me",
  "c",
  "claim",
  "queue",
  "new",
  "edit",
  "import",
  "report",
  "api",
]);

function asciify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ə/g, "e")
    .replace(/ñ/g, "n");
}

function slugify(input: string): string {
  let s = (input ?? "").trim();
  s = s.replace(/مسجد/g, "masjid").replace(/جامع/g, "jami");
  s = asciify(s).toLowerCase();
  return s.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function buildMosqueSlug(nameEn: string, city: string): string {
  const base = slugify(nameEn);
  const c = slugify(city);
  if (!base) return c || "mosque";
  if (!c) return base;
  if (base.endsWith(`-${c}`) || base === c) return base;
  return `${base}-${c}`;
}

function pickSlug(base: string, taken: Set<string>): string {
  if (!RESERVED_PATHS.has(base) && !taken.has(base)) return base;
  let i = 2;
  while (RESERVED_PATHS.has(`${base}-${i}`) || taken.has(`${base}-${i}`)) {
    i += 1;
    if (i > 999) throw new Error("slug collision space exhausted");
  }
  return `${base}-${i}`;
}

type Counts = {
  scanned: number;
  skippedApproved: number;
  skippedExisting: number;
  skippedInvalid: number;
  written: number;
};

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(
    `migrate-submissions-to-mosques (${dryRun ? "DRY RUN" : "WRITE"}) — ` +
      `project=${process.env.FIREBASE_PROJECT_ID} ` +
      `db=${process.env.FIREBASE_DATABASE_ID ?? "main"}`,
  );

  const firestore = db();
  const counts: Counts = {
    scanned: 0,
    skippedApproved: 0,
    skippedExisting: 0,
    skippedInvalid: 0,
    written: 0,
  };

  // Pre-fetch existing mosque slugs in one round-trip; we need this for
  // both collision detection and idempotency.
  const existing = await firestore.collection(TARGET).select().get();
  const taken = new Set<string>(existing.docs.map((d) => d.id));
  console.log(`Found ${taken.size} existing mosque(s) in '${TARGET}'.`);

  const subsSnap = await firestore.collection(SOURCE).get();
  console.log(`Found ${subsSnap.size} submission(s) in '${SOURCE}'.`);

  let batch = firestore.batch();
  let pendingWrites = 0;

  for (const doc of subsSnap.docs) {
    counts.scanned++;
    const data = doc.data() as Record<string, unknown>;
    const subStatus = data.status as string | undefined;

    if (subStatus === "approved") {
      counts.skippedApproved++;
      continue;
    }

    const payload = data.payload as Record<string, unknown> | undefined;
    const name = payload?.name as { en?: string; ar?: string } | undefined;
    const city = payload?.city as string | undefined;
    const country = payload?.country as string | undefined;
    if (!payload || !name?.en || !city || !country) {
      counts.skippedInvalid++;
      continue;
    }

    const baseSlug = buildMosqueSlug(name.en, city);
    const slug = pickSlug(baseSlug, taken);

    // If the deterministic slug already maps to a mosque whose name
    // matches, treat it as already-migrated and skip rather than create
    // a -2 collision.
    if (taken.has(baseSlug)) {
      counts.skippedExisting++;
      continue;
    }
    taken.add(slug);

    const status: "pending_review" | "rejected" =
      subStatus === "rejected" ? "rejected" : "pending_review";

    const createdAt = data.createdAt as Timestamp | undefined;
    const decidedAt = data.decidedAt as Timestamp | undefined;
    const updatedAt = decidedAt ?? createdAt ?? Timestamp.now();
    const reviewedAtIso =
      data.decidedAt instanceof Timestamp
        ? (data.decidedAt as Timestamp).toDate().toISOString()
        : undefined;

    const moderation: Record<string, unknown> = {};
    if (data.decidedBy) moderation.reviewedBy = data.decidedBy;
    if (reviewedAtIso) moderation.reviewedAt = reviewedAtIso;
    if (data.rejectionReason) moderation.rejectionReason = data.rejectionReason;

    const mosqueDoc: Record<string, unknown> = {
      ...payload,
      slug,
      status,
      citySlug: slugify(city),
      countrySlug: country.toLowerCase(),
      geohash: "",
      searchTokens: [],
      submittedBy: data.submittedBy ?? {},
      createdAt: createdAt ?? Timestamp.now(),
      updatedAt,
    };
    if (Object.keys(moderation).length > 0) mosqueDoc.moderation = moderation;

    if (!dryRun) {
      batch.set(firestore.collection(TARGET).doc(slug), mosqueDoc, {
        merge: false,
      });
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
    `scanned=${counts.scanned} written=${counts.written} skippedApproved=${counts.skippedApproved} skippedExisting=${counts.skippedExisting} skippedInvalid=${counts.skippedInvalid}`,
  );
  if (dryRun) console.log("(Dry run — nothing was written.)");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
