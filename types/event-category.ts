import type { LocalizedTextRequired } from "./business";

export interface EventCategoryDoc {
  id: string;
  slug: string;
  name: LocalizedTextRequired;
  iconKey?: string;
  sortOrder: number;
  isActive: boolean;
}
