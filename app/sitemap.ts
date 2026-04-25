import type { MetadataRoute } from "next";
import { listAllPublishedSlugs } from "@/lib/blog/data";
import { fetchPublishedMosques, fetchCountryAggregates } from "@/lib/admin/data/mosques";
import { listPublishedSlugs as listPublishedBusinessSlugs } from "@/lib/businesses/public";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ?? "http://localhost:7777";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, priority: 1.0 },
    { url: `${SITE_URL}/quran`, lastModified: now, priority: 0.8 },
    { url: `${SITE_URL}/hadith`, lastModified: now, priority: 0.8 },
    { url: `${SITE_URL}/articles`, lastModified: now, priority: 0.7 },
    { url: `${SITE_URL}/mosques`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/businesses`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
  ];
  const slugs = await listAllPublishedSlugs();
  const articleEntries: MetadataRoute.Sitemap = slugs
    .filter((s) => s.locale === "en")
    .map((s) => ({
      url: `${SITE_URL}/articles/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  const [{ mosques }, countries] = await Promise.all([
    fetchPublishedMosques({ limit: 5000 }),
    fetchCountryAggregates(),
  ]);
  const mosqueEntries: MetadataRoute.Sitemap = mosques.map((m) => ({
    url: `${SITE_URL}/mosques/${m.slug}`,
    lastModified: m.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  const countryEntries: MetadataRoute.Sitemap = countries.map((c) => ({
    url: `${SITE_URL}/mosques/c/${c.countrySlug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));
  const cityKeys = new Set<string>();
  const cityEntries: MetadataRoute.Sitemap = [];
  for (const m of mosques) {
    const key = `${m.countrySlug}/${m.citySlug}`;
    if (cityKeys.has(key)) continue;
    cityKeys.add(key);
    cityEntries.push({
      url: `${SITE_URL}/mosques/c/${m.countrySlug}/${m.citySlug}`,
      lastModified: m.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    });
  }

  const businessSlugs = await listPublishedBusinessSlugs();
  const businessEntries: MetadataRoute.Sitemap = businessSlugs.map((b) => ({
    url: `${SITE_URL}/businesses/${b.slug}`,
    lastModified: b.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    ...staticEntries,
    ...articleEntries,
    ...countryEntries,
    ...cityEntries,
    ...mosqueEntries,
    ...businessEntries,
  ];
}
