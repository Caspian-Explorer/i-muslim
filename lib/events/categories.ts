import { pickLocalized } from "@/lib/utils";
import type { EventCategoryDoc } from "@/types/event-category";

export function resolveCategoryName(
  slug: string,
  categories: EventCategoryDoc[],
  locale: string,
): string {
  const match = categories.find((c) => c.slug === slug);
  if (!match) return slug;
  return pickLocalized(match.name, locale, "en") ?? slug;
}
