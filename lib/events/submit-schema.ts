import { z } from "zod";

export const EVENT_SUBMISSIONS_COLLECTION = "eventSubmissions";

const categoryEnum = z.enum([
  "prayer",
  "lecture",
  "iftar",
  "janazah",
  "class",
  "fundraiser",
  "community",
  "other",
]);

const locationModeEnum = z.enum(["in-person", "online", "hybrid"]);

const optionalUrl = z
  .string()
  .url()
  .optional()
  .or(z.literal("").transform(() => undefined));

export const eventSubmitSchema = z
  .object({
    title: z.string().trim().min(2),
    description: z.string().trim().optional(),
    category: categoryEnum,
    startsAt: z.string().min(1),
    endsAt: z.string().optional().or(z.literal("").transform(() => undefined)),
    timezone: z.string().min(1),
    location: z.object({
      mode: locationModeEnum,
      venue: z.string().trim().optional(),
      address: z.string().trim().optional(),
      url: optionalUrl,
    }),
    organizer: z.object({
      name: z.string().trim().min(1),
      contact: z.string().trim().optional(),
    }),
    submitterEmail: z.string().email(),
    website_url_secondary: z.string().optional(),
  })
  .refine(
    (v) => !v.endsAt || new Date(v.endsAt).getTime() >= new Date(v.startsAt).getTime(),
    { message: "endsAt must be after startsAt", path: ["endsAt"] },
  )
  .refine(
    (v) => v.location.mode === "online" || Boolean(v.location.venue || v.location.address),
    { message: "Venue or address is required for in-person events", path: ["location", "venue"] },
  )
  .refine(
    (v) => v.location.mode === "in-person" || Boolean(v.location.url),
    { message: "Meeting URL is required for online events", path: ["location", "url"] },
  );

export type EventSubmitInput = z.infer<typeof eventSubmitSchema>;
