// Pure types + constants for the admin secrets config doc. Safe to import
// from client components — does NOT pull in firebase-admin like secrets.ts.

export const GEMINI_MODELS = [
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
] as const;

export type GeminiModel = (typeof GEMINI_MODELS)[number];

export const DEFAULT_GEMINI_MODEL: GeminiModel = "gemini-2.5-flash";

export type GeminiConfigStatus = {
  configured: boolean;
  maskedKey: string | null;
  model: GeminiModel;
  updatedAt: string | null;
  updatedBy: string | null;
};
