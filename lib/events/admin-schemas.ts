import { z } from "zod";
import { BUNDLED_LOCALES } from "@/i18n/config";

const localizedRequired = z.object(
  Object.fromEntries(BUNDLED_LOCALES.map((l) => [l, z.string().min(1)])) as Record<
    (typeof BUNDLED_LOCALES)[number],
    z.ZodString
  >,
);

const optionalString = z
  .union([z.string(), z.literal("")])
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

export const eventCategoryInputSchema = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "lowercase letters, digits, hyphens"),
  name: localizedRequired,
  iconKey: optionalString,
  sortOrder: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

export type EventCategoryInput = z.infer<typeof eventCategoryInputSchema>;
