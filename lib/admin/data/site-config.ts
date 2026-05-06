import "server-only";
import { cache } from "react";
import { Timestamp } from "firebase-admin/firestore";
import { getDb, requireDb } from "@/lib/firebase/admin";
import { publicUrlFor, type SiteUploadKind } from "@/lib/site-config/storage";

export const SITE_CONFIG_COLLECTION = "config";
export const SITE_CONFIG_DOC = "site";

export const DEFAULT_SITE_NAME = "i-muslim";

export interface SiteConfig {
  siteName: string;
  tagline: string;
  logoStoragePath: string | null;
  logoUrl: string | null;
  faviconStoragePath: string | null;
  faviconUrl: string | null;
  ogImageStoragePath: string | null;
  ogImageUrl: string | null;
  articlePlaceholderStoragePath: string | null;
  articlePlaceholderUrl: string | null;
}

function emptyConfig(): SiteConfig {
  return {
    siteName: DEFAULT_SITE_NAME,
    tagline: "",
    logoStoragePath: null,
    logoUrl: null,
    faviconStoragePath: null,
    faviconUrl: null,
    ogImageStoragePath: null,
    ogImageUrl: null,
    articlePlaceholderStoragePath: null,
    articlePlaceholderUrl: null,
  };
}

function pathField(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function urlFor(path: string | null): string | null {
  return path ? publicUrlFor(path) : null;
}

function shapeFromData(data: Record<string, unknown>): SiteConfig {
  const logoStoragePath = pathField(data.logoStoragePath);
  const faviconStoragePath = pathField(data.faviconStoragePath);
  const ogImageStoragePath = pathField(data.ogImageStoragePath);
  const articlePlaceholderStoragePath = pathField(data.articlePlaceholderStoragePath);
  const siteName =
    typeof data.siteName === "string" && data.siteName.trim().length > 0
      ? data.siteName.trim()
      : DEFAULT_SITE_NAME;
  const tagline = typeof data.tagline === "string" ? data.tagline.trim() : "";
  return {
    siteName,
    tagline,
    logoStoragePath,
    logoUrl: urlFor(logoStoragePath),
    faviconStoragePath,
    faviconUrl: urlFor(faviconStoragePath),
    ogImageStoragePath,
    ogImageUrl: urlFor(ogImageStoragePath),
    articlePlaceholderStoragePath,
    articlePlaceholderUrl: urlFor(articlePlaceholderStoragePath),
  };
}

async function readSiteConfig(): Promise<SiteConfig> {
  const db = getDb();
  if (!db) return emptyConfig();
  try {
    const snap = await db
      .collection(SITE_CONFIG_COLLECTION)
      .doc(SITE_CONFIG_DOC)
      .get();
    if (!snap.exists) return emptyConfig();
    return shapeFromData(snap.data() ?? {});
  } catch (err) {
    console.warn("[admin/data/site-config] read failed:", err);
    return emptyConfig();
  }
}

// Cached per-render so multiple RSCs in one tree (root layout, admin layout,
// site layout) share a single Firestore round-trip.
export const getSiteConfig = cache(readSiteConfig);

export interface SiteIdentityInput {
  siteName: string;
  tagline: string;
}

export async function setSiteIdentity(
  input: SiteIdentityInput,
  adminEmail: string,
): Promise<SiteConfig> {
  const db = requireDb();
  await db
    .collection(SITE_CONFIG_COLLECTION)
    .doc(SITE_CONFIG_DOC)
    .set(
      {
        siteName: input.siteName.trim() || DEFAULT_SITE_NAME,
        tagline: input.tagline.trim(),
        updatedAt: Timestamp.now(),
        updatedBy: adminEmail,
      },
      { merge: true },
    );
  return readSiteConfig();
}

const KIND_TO_PATH_FIELD: Record<SiteUploadKind, string> = {
  logo: "logoStoragePath",
  favicon: "faviconStoragePath",
  og: "ogImageStoragePath",
  articlePlaceholder: "articlePlaceholderStoragePath",
};

export interface SetSiteAssetInput {
  kind: SiteUploadKind;
  storagePath: string | null;
}

export async function setSiteAsset(
  input: SetSiteAssetInput,
  adminEmail: string,
): Promise<SiteConfig> {
  const db = requireDb();
  const fieldName = KIND_TO_PATH_FIELD[input.kind];
  await db
    .collection(SITE_CONFIG_COLLECTION)
    .doc(SITE_CONFIG_DOC)
    .set(
      {
        [fieldName]: input.storagePath,
        updatedAt: Timestamp.now(),
        updatedBy: adminEmail,
      },
      { merge: true },
    );
  return readSiteConfig();
}
