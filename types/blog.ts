import type { Locale } from "@/i18n/config";

export type ArticleStatus = "draft" | "published";

/**
 * Seed slugs used to populate the `articleCategories` Firestore collection on
 * first read. Once the admin starts editing categories at /admin/articles/categories
 * the live list replaces these; the seed only matters for fresh installs and
 * for the read-only public site when Firestore is unavailable.
 */
export const CATEGORY_SLUGS = [
  "prayer-times",
  "hijri",
  "quran-hadith",
  "qibla",
] as const;

/**
 * The slug stored on each article. Was a union of the four seeded slugs; now
 * a plain string so admins can add new categories from /admin/articles/categories.
 */
export type CategorySlug = string;

export interface ArticleCategoryDoc {
  id: string;
  slug: CategorySlug;
  name: { en: string; ar: string; tr: string; id: string };
  iconKey?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ArticleTranslation {
  title: string;
  slug: string;
  excerpt: string;
  bodyMd: string;
  status: ArticleStatus;
  publishedAt: string | null;
  readingMinutes: number;
}

export interface Article {
  id: string;
  category: CategorySlug;
  heroImageUrl: string | null;
  heroImageAlt: string | null;
  authorId: string;
  translations: Partial<Record<Locale, ArticleTranslation>>;
  publishedLocales: Locale[];
  latestPublishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: CategorySlug;
  heroImageUrl: string | null;
  heroImageAlt: string | null;
  publishedAt: string;
  readingMinutes: number;
}

export interface PublicArticle extends ArticleListItem {
  bodyMd: string;
  bodyHtml: string;
  authorId: string;
  availableLocales: Locale[];
  updatedAt: string;
}

export interface AdminArticleRow {
  id: string;
  category: CategorySlug;
  heroImageUrl: string | null;
  authorId: string;
  publishedLocales: Locale[];
  latestPublishedAt: string | null;
  updatedAt: string;
  createdAt: string;
  translations: Partial<
    Record<
      Locale,
      Pick<ArticleTranslation, "title" | "slug" | "status" | "publishedAt">
    >
  >;
}
