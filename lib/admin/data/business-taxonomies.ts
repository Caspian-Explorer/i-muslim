import "server-only";
import { getDb } from "@/lib/firebase/admin";
import {
  MOCK_AMENITIES,
  MOCK_CATEGORIES,
  MOCK_CERT_BODIES,
} from "@/lib/admin/mock/business-taxonomies";
import type {
  BusinessAmenity,
  BusinessCategory,
  BusinessCertificationBody,
  LocalizedTextRequired,
} from "@/types/business";
import { BUNDLED_LOCALES, type BundledLocale } from "@/i18n/config";

type Source = "firestore" | "mock";

function asLocalizedRequired(raw: unknown, fallback: string): LocalizedTextRequired {
  const r = (raw ?? {}) as Record<string, unknown>;
  const out = {} as LocalizedTextRequired;
  for (const l of BUNDLED_LOCALES as readonly BundledLocale[]) {
    out[l] = typeof r[l] === "string" && (r[l] as string).length > 0 ? (r[l] as string) : fallback;
  }
  return out;
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asOptionalString(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function normalizeCategory(id: string, raw: Record<string, unknown>): BusinessCategory | null {
  const slug = asString(raw.slug);
  if (!slug) return null;
  const sortRaw = typeof raw.sortOrder === "number" ? raw.sortOrder : 0;
  return {
    id,
    slug,
    name: asLocalizedRequired(raw.name, slug),
    iconKey: asOptionalString(raw.iconKey),
    sortOrder: sortRaw,
    isActive: raw.isActive !== false,
  };
}

function normalizeAmenity(id: string, raw: Record<string, unknown>): BusinessAmenity | null {
  const slug = asString(raw.slug);
  if (!slug) return null;
  return {
    id,
    slug,
    name: asLocalizedRequired(raw.name, slug),
    iconKey: asOptionalString(raw.iconKey),
  };
}

function normalizeCertBody(id: string, raw: Record<string, unknown>): BusinessCertificationBody | null {
  const slug = asString(raw.slug);
  const name = asString(raw.name);
  if (!slug || !name) return null;
  return {
    id,
    slug,
    name,
    country: asString(raw.country, "GB").toUpperCase(),
    website: asOptionalString(raw.website),
    logoStoragePath: asOptionalString(raw.logoStoragePath),
    verifiedByPlatform: Boolean(raw.verifiedByPlatform),
  };
}

export async function fetchCategories(): Promise<{ categories: BusinessCategory[]; source: Source }> {
  const db = getDb();
  if (!db) return { categories: MOCK_CATEGORIES, source: "mock" };
  try {
    const snap = await db.collection("categories").orderBy("sortOrder", "asc").limit(200).get();
    if (snap.empty) return { categories: MOCK_CATEGORIES, source: "mock" };
    const categories = snap.docs
      .map((d) => normalizeCategory(d.id, d.data() as Record<string, unknown>))
      .filter((c): c is BusinessCategory => c !== null);
    return { categories, source: "firestore" };
  } catch (err) {
    console.warn("[admin/data/business-taxonomies] categories read failed:", err);
    return { categories: MOCK_CATEGORIES, source: "mock" };
  }
}

export async function fetchAmenities(): Promise<{ amenities: BusinessAmenity[]; source: Source }> {
  const db = getDb();
  if (!db) return { amenities: MOCK_AMENITIES, source: "mock" };
  try {
    const snap = await db.collection("amenityTaxonomy").limit(200).get();
    if (snap.empty) return { amenities: MOCK_AMENITIES, source: "mock" };
    const amenities = snap.docs
      .map((d) => normalizeAmenity(d.id, d.data() as Record<string, unknown>))
      .filter((a): a is BusinessAmenity => a !== null);
    return { amenities, source: "firestore" };
  } catch (err) {
    console.warn("[admin/data/business-taxonomies] amenities read failed:", err);
    return { amenities: MOCK_AMENITIES, source: "mock" };
  }
}

export async function fetchCertBodies(): Promise<{ certBodies: BusinessCertificationBody[]; source: Source }> {
  const db = getDb();
  if (!db) return { certBodies: MOCK_CERT_BODIES, source: "mock" };
  try {
    const snap = await db.collection("certificationBodies").limit(200).get();
    if (snap.empty) return { certBodies: MOCK_CERT_BODIES, source: "mock" };
    const certBodies = snap.docs
      .map((d) => normalizeCertBody(d.id, d.data() as Record<string, unknown>))
      .filter((c): c is BusinessCertificationBody => c !== null);
    return { certBodies, source: "firestore" };
  } catch (err) {
    console.warn("[admin/data/business-taxonomies] certBodies read failed:", err);
    return { certBodies: MOCK_CERT_BODIES, source: "mock" };
  }
}
