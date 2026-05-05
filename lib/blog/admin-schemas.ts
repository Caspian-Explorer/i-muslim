import { z } from "zod";
import { isValidSlug } from "@/lib/blog/slug";

const localizedRequiredSchema = z.object({
  en: z.string().trim().min(1, "English name is required").max(120),
  ar: z.string().trim().min(1, "Arabic name is required").max(120),
  tr: z.string().trim().min(1, "Turkish name is required").max(120),
  id: z.string().trim().min(1, "Indonesian name is required").max(120),
});

export const articleCategoryInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(80)
    .refine((s) => isValidSlug(s), "Invalid slug (lowercase letters, numbers, hyphens only)"),
  name: localizedRequiredSchema,
  iconKey: z.string().trim().max(80).optional(),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true),
});

export type ArticleCategoryInput = z.infer<typeof articleCategoryInputSchema>;
