import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getDb } from "@/lib/firebase/admin";
import { SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";

interface QuranAyahPayload {
  variant: "quran";
  surah: number;
  ayah: number;
  verseKey: string;
}

interface HadithPayload {
  variant: "hadith";
  collection: string;
  book: number;
  number: number;
}

type ReadingProgressPayload = QuranAyahPayload | HadithPayload;

function parseBody(raw: unknown): ReadingProgressPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.variant === "quran") {
    if (
      typeof r.surah === "number" &&
      Number.isFinite(r.surah) &&
      r.surah >= 1 &&
      r.surah <= 114 &&
      typeof r.ayah === "number" &&
      Number.isFinite(r.ayah) &&
      r.ayah >= 1 &&
      typeof r.verseKey === "string"
    ) {
      return { variant: "quran", surah: r.surah, ayah: r.ayah, verseKey: r.verseKey };
    }
    return null;
  }
  if (r.variant === "hadith") {
    if (
      typeof r.collection === "string" &&
      r.collection &&
      typeof r.book === "number" &&
      Number.isFinite(r.book) &&
      typeof r.number === "number" &&
      Number.isFinite(r.number)
    ) {
      return {
        variant: "hadith",
        collection: r.collection,
        book: r.book,
        number: r.number,
      };
    }
    return null;
  }
  return null;
}

export async function POST(req: Request) {
  const auth = getAdminAuth();
  const db = getDb();
  if (!auth || !db) return new NextResponse(null, { status: 204 });

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return new NextResponse(null, { status: 204 });

  let decoded;
  try {
    decoded = await auth.verifySessionCookie(token, true);
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const payload = parseBody(raw);
  if (!payload) return new NextResponse(null, { status: 204 });

  const docRef = db
    .collection("users")
    .doc(decoded.uid)
    .collection("state")
    .doc("readingProgress");

  try {
    if (payload.variant === "quran") {
      await docRef.set(
        {
          lastQuranAyah: {
            surah: payload.surah,
            ayah: payload.ayah,
            verseKey: payload.verseKey,
            viewedAt: FieldValue.serverTimestamp(),
          },
          lastSurah: {
            surah: payload.surah,
            viewedAt: FieldValue.serverTimestamp(),
          },
        },
        { merge: true },
      );
    } else {
      await docRef.set(
        {
          lastHadith: {
            collection: payload.collection,
            book: payload.book,
            number: payload.number,
            viewedAt: FieldValue.serverTimestamp(),
          },
          lastHadithBook: {
            collection: payload.collection,
            book: payload.book,
            viewedAt: FieldValue.serverTimestamp(),
          },
        },
        { merge: true },
      );
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.warn("[profile/reading-progress] write failed:", err);
    return new NextResponse(null, { status: 204 });
  }
}
