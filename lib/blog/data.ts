import "server-only";
import { unstable_cache } from "next/cache";
import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/admin";
import { LOCALES, type Locale } from "@/i18n/config";
import { renderMarkdown } from "@/lib/blog/markdown";
import { CACHE_TAGS } from "@/lib/blog/cache-tags";
import { isCategorySlug } from "@/lib/blog/taxonomy";
import type {
  Article,
  ArticleListItem,
  ArticleTranslation,
  CategorySlug,
  PublicArticle,
} from "@/types/blog";
import { dirFor } from "@/i18n/config";

const COLLECTION = "articles";
const LIST_LIMIT_DEFAULT = 20;

function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

function tsToIso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  if (
    typeof value === "object" &&
    value &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  return null;
}

function readTranslations(
  raw: Record<string, unknown> | undefined,
): Partial<Record<Locale, ArticleTranslation>> {
  if (!raw) return {};
  const out: Partial<Record<Locale, ArticleTranslation>> = {};
  for (const locale of LOCALES) {
    const t = raw[locale] as Record<string, unknown> | undefined;
    if (!t) continue;
    const status = t.status === "published" ? "published" : "draft";
    out[locale] = {
      title: typeof t.title === "string" ? t.title : "",
      slug: typeof t.slug === "string" ? t.slug : "",
      excerpt: typeof t.excerpt === "string" ? t.excerpt : "",
      bodyMd: typeof t.bodyMd === "string" ? t.bodyMd : "",
      status,
      publishedAt: tsToIso(t.publishedAt),
      readingMinutes:
        typeof t.readingMinutes === "number" ? t.readingMinutes : 1,
    };
  }
  return out;
}

export function normalizeArticle(
  id: string,
  raw: Record<string, unknown>,
): Article {
  const category: CategorySlug = isCategorySlug(raw.category)
    ? raw.category
    : "prayer-times";
  const publishedLocales: Locale[] = Array.isArray(raw.publishedLocales)
    ? (raw.publishedLocales.filter(isLocale) as Locale[])
    : [];
  return {
    id,
    category,
    heroImageUrl:
      typeof raw.heroImageUrl === "string" ? raw.heroImageUrl : null,
    heroImageAlt:
      typeof raw.heroImageAlt === "string" ? raw.heroImageAlt : null,
    authorId: typeof raw.authorId === "string" ? raw.authorId : "fuad",
    translations: readTranslations(
      raw.translations as Record<string, unknown> | undefined,
    ),
    publishedLocales,
    latestPublishedAt: tsToIso(raw.latestPublishedAt),
    createdAt: tsToIso(raw.createdAt) ?? new Date().toISOString(),
    updatedAt: tsToIso(raw.updatedAt) ?? new Date().toISOString(),
  };
}

function toListItem(
  article: Article,
  locale: Locale,
): ArticleListItem | null {
  const t = article.translations[locale];
  if (!t || t.status !== "published" || !t.publishedAt) return null;
  return {
    id: article.id,
    slug: t.slug,
    title: t.title,
    excerpt: t.excerpt,
    category: article.category,
    heroImageUrl: article.heroImageUrl,
    heroImageAlt: article.heroImageAlt,
    publishedAt: t.publishedAt,
    readingMinutes: t.readingMinutes,
  };
}

interface ListOptions {
  category?: CategorySlug;
  limit?: number;
}

async function listPublishedArticlesUncached(
  locale: Locale,
  opts: ListOptions = {},
): Promise<{ items: ArticleListItem[] }> {
  const db = getDb();
  if (!db) return { items: [] };
  try {
    let query = db
      .collection(COLLECTION)
      .where("publishedLocales", "array-contains", locale)
      .orderBy("latestPublishedAt", "desc")
      .limit(opts.limit ?? LIST_LIMIT_DEFAULT);
    if (opts.category) {
      query = query.where("category", "==", opts.category);
    }
    const snap = await query.get();
    const items: ArticleListItem[] = [];
    for (const doc of snap.docs) {
      const article = normalizeArticle(doc.id, doc.data());
      const item = toListItem(article, locale);
      if (item) items.push(item);
    }
    return { items };
  } catch (err) {
    console.warn("[blog/data] listPublishedArticles failed:", err);
    return { items: [] };
  }
}

export function listPublishedArticles(
  locale: Locale,
  opts: ListOptions = {},
): Promise<{ items: ArticleListItem[] }> {
  return unstable_cache(
    () => listPublishedArticlesUncached(locale, opts),
    ["blog-list", locale, opts.category ?? "all", String(opts.limit ?? LIST_LIMIT_DEFAULT)],
    { tags: [CACHE_TAGS.list(locale)], revalidate: 3600 },
  )();
}

async function getArticleBySlugUncached(
  slug: string,
  locale: Locale,
): Promise<PublicArticle | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const snap = await db
      .collection(COLLECTION)
      .where("publishedLocales", "array-contains", locale)
      .limit(50)
      .get();
    for (const doc of snap.docs) {
      const article = normalizeArticle(doc.id, doc.data());
      const t = article.translations[locale];
      if (!t || t.status !== "published" || t.slug !== slug) continue;
      const html = await renderMarkdown(t.bodyMd, { dir: dirFor(locale) });
      const availableLocales = (Object.keys(article.translations) as Locale[]).filter(
        (loc) => article.translations[loc]?.status === "published",
      );
      return {
        id: article.id,
        slug: t.slug,
        title: t.title,
        excerpt: t.excerpt,
        category: article.category,
        heroImageUrl: article.heroImageUrl,
        heroImageAlt: article.heroImageAlt,
        publishedAt: t.publishedAt ?? article.updatedAt,
        readingMinutes: t.readingMinutes,
        bodyMd: t.bodyMd,
        bodyHtml: html,
        authorId: article.authorId,
        availableLocales,
        updatedAt: article.updatedAt,
      };
    }
    return null;
  } catch (err) {
    console.warn("[blog/data] getArticleBySlug failed:", err);
    return null;
  }
}

export function getArticleBySlug(
  slug: string,
  locale: Locale,
): Promise<PublicArticle | null> {
  return unstable_cache(
    () => getArticleBySlugUncached(slug, locale),
    ["blog-post", locale, slug],
    { tags: [CACHE_TAGS.list(locale)], revalidate: 3600 },
  )();
}

export async function getRelatedArticles(
  articleId: string,
  category: CategorySlug,
  locale: Locale,
  limit = 3,
): Promise<ArticleListItem[]> {
  const { items } = await listPublishedArticles(locale, { category, limit: limit + 1 });
  return items.filter((it) => it.id !== articleId).slice(0, limit);
}

export async function listAllPublishedSlugs(): Promise<
  { locale: Locale; slug: string; updatedAt: Date }[]
> {
  const db = getDb();
  if (!db) return [];
  try {
    const snap = await db.collection(COLLECTION).limit(1000).get();
    const out: { locale: Locale; slug: string; updatedAt: Date }[] = [];
    for (const doc of snap.docs) {
      const article = normalizeArticle(doc.id, doc.data());
      const updatedAt = new Date(article.updatedAt);
      for (const locale of article.publishedLocales) {
        const t = article.translations[locale];
        if (!t || t.status !== "published") continue;
        out.push({ locale, slug: t.slug, updatedAt });
      }
    }
    return out;
  } catch (err) {
    console.warn("[blog/data] listAllPublishedSlugs failed:", err);
    return [];
  }
}
