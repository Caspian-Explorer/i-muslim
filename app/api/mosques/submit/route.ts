import { NextResponse } from "next/server";
import { z } from "zod";
import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/admin";
import { getSiteSession } from "@/lib/auth/session";
import { MOSQUE_SUBMISSIONS_COLLECTION, emptyServices } from "@/lib/mosques/constants";
import { defaultPrayerCalc } from "@/lib/mosques/adhan";
import { verifyTurnstile } from "@/lib/mosques/turnstile";
import { createNotification } from "@/lib/admin/data/notifications";

const schema = z.object({
  nameEn: z.string().min(2),
  nameAr: z.string().optional(),
  addressLine1: z.string().min(2),
  city: z.string().min(1),
  country: z.string().regex(/^[A-Za-z]{2}$/),
  denomination: z.enum(["sunni", "shia", "ibadi", "ahmadi", "other", "unspecified"]).default("unspecified"),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  description: z.string().optional(),
  languages: z.array(z.string()).max(20).default([]),
  website_url_secondary: z.string().optional(), // honeypot
  turnstileToken: z.string().optional(),
});

const RATE_LIMIT_PER_DAY = 5;

export async function POST(req: Request) {
  const session = await getSiteSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "auth" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "invalid_input" },
      { status: 400 },
    );
  }
  const data = parsed.data;
  if (data.website_url_secondary && data.website_url_secondary.length > 0) {
    // honeypot tripped — pretend success to throw off bots.
    return NextResponse.json({ ok: true });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const turnstile = await verifyTurnstile(data.turnstileToken, ip);
  if (!turnstile.success) {
    return NextResponse.json({ ok: false, error: "turnstile" }, { status: 403 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ ok: false, error: "firestore_not_configured" }, { status: 503 });
  }

  // Rate limit per uid per day, matching the events + business submit routes.
  const since = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
  try {
    const recent = await db
      .collection(MOSQUE_SUBMISSIONS_COLLECTION)
      .where("submittedBy.uid", "==", session.uid)
      .where("createdAt", ">", since)
      .count()
      .get();
    if (recent.data().count >= RATE_LIMIT_PER_DAY) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }
  } catch {
    // count() requires composite index; if missing, skip rate limit rather than block submission.
  }

  // Firestore Admin SDK rejects undefined field values by default, so build the
  // optional pieces conditionally rather than letting them resolve to undefined.
  const contact: { phone?: string; website?: string; email?: string } = {};
  if (data.phone) contact.phone = data.phone;
  if (data.website) contact.website = data.website;
  if (data.email) contact.email = data.email;

  const payload = {
    name: { en: data.nameEn.trim(), ...(data.nameAr ? { ar: data.nameAr.trim() } : {}) },
    denomination: data.denomination,
    address: { line1: data.addressLine1.trim() },
    city: data.city.trim(),
    country: data.country.toUpperCase(),
    location: { lat: 0, lng: 0 }, // admin will geocode + set on promote
    timezone: "UTC",
    ...(Object.keys(contact).length > 0 ? { contact } : {}),
    services: emptyServices(),
    languages: data.languages,
    prayerCalc: defaultPrayerCalc(),
    ...(data.description ? { description: { en: data.description.trim() } } : {}),
  };

  const docRef = await db.collection(MOSQUE_SUBMISSIONS_COLLECTION).add({
    status: "pending_review",
    payload,
    submittedBy: { uid: session.uid, email: session.email },
    submitterIp: ip,
    createdAt: Timestamp.now(),
  });
  await createNotification({
    type: "submission",
    title: "New mosque submission",
    body: data.nameEn,
    link: `/admin/mosques?submission=${docRef.id}`,
    sourceCollection: MOSQUE_SUBMISSIONS_COLLECTION,
    sourceId: docRef.id,
  });
  return NextResponse.json({ ok: true, id: docRef.id });
}
