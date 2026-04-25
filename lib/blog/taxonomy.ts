import { CATEGORY_SLUGS, type CategorySlug } from "@/types/blog";

export { CATEGORY_SLUGS };
export type { CategorySlug };

export function isCategorySlug(value: unknown): value is CategorySlug {
  return (
    typeof value === "string" &&
    (CATEGORY_SLUGS as readonly string[]).includes(value)
  );
}
