import type { Locale } from "@/i18n/config";

export const CACHE_TAGS = {
  list: (locale: Locale) => `articles:list:${locale}`,
  post: (id: string) => `articles:post:${id}`,
  slugs: () => `articles:slugs`,
} as const;
