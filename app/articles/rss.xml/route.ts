import { listPublishedArticles } from "@/lib/blog/data";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ?? "http://localhost:7777";

export const revalidate = 3600;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const { items } = await listPublishedArticles("en", { limit: 20 });
  const lastBuildDate = new Date(
    items[0]?.publishedAt ?? new Date().toISOString(),
  ).toUTCString();

  const itemsXml = items
    .map((item) => {
      const url = `${SITE_URL}/articles/${item.slug}`;
      return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate>
      <description>${escapeXml(item.excerpt)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>i-muslim Articles</title>
    <link>${SITE_URL}/articles</link>
    <atom:link href="${SITE_URL}/articles/rss.xml" rel="self" type="application/rss+xml" />
    <description>Articles from i-muslim — Prayer Times, Hijri, Quran &amp; Hadith, Qibla.</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
