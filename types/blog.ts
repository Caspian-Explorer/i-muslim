import type { Locale } from "@/i18n/config";

export type ArticleStatus = "draft" | "published";

export const CATEGORY_SLUGS = [
  "prayer-times",
  "hijri",
  "quran-hadith",
  "qibla",
] as const;
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

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
