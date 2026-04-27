// UI locale registry.
//
// Two tiers of locales live in this file:
//
//   1. **Bundled** — `en`, `ar`, `tr`, `id`. Their translations ship as static
//      JSON in `messages/<code>.json`. Always routable.
//   2. **Reserved** — pre-declared codes (e.g. `fr`, `ur`) that are routable
//      but have no bundled translations. Each becomes usable when an admin
//      "activates" it from /admin/settings by pasting a translations JSON;
//      the doc is stored in Firestore at `config/uiLocales/{code}` and
//      i18n/request.ts deep-merges it over English at request time.
//
// Both tiers are listed in LOCALES so next-intl's middleware accepts their
// URL prefixes. Un-activated reserved locales fall back to English content.

export const BUNDLED_LOCALES = ["en", "ar", "tr", "id"] as const;

// Reserved pool — common Muslim-audience UI languages an admin may activate
// without a deploy. Adding to this list IS a code change (next-intl bakes the
// regex at build time), so keep it curated; activation/deactivation is the
// runtime operation.
export const RESERVED_LOCALES = [
  "ru",
  "az",
  "fr",
  "ur",
  "fa",
  "bn",
  "ms",
  "de",
  "es",
  "hi",
] as const;

export const LOCALES = [...BUNDLED_LOCALES, ...RESERVED_LOCALES] as const;
export type Locale = (typeof LOCALES)[number];
export type BundledLocale = (typeof BUNDLED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const RTL_LOCALES = new Set<Locale>(["ar", "ur", "fa"]);
export const LOCALE_COOKIE = "i-muslim-lang";

export const LOCALE_META: Record<
  Locale,
  { nativeName: string; englishName: string; flag: string }
> = {
  en: { nativeName: "English", englishName: "English", flag: "🇬🇧" },
  ar: { nativeName: "العربية", englishName: "Arabic", flag: "🇸🇦" },
  tr: { nativeName: "Türkçe", englishName: "Turkish", flag: "🇹🇷" },
  id: { nativeName: "Bahasa Indonesia", englishName: "Indonesian", flag: "🇮🇩" },
  ru: { nativeName: "Русский", englishName: "Russian", flag: "🇷🇺" },
  az: { nativeName: "Azərbaycanca", englishName: "Azerbaijani", flag: "🇦🇿" },
  fr: { nativeName: "Français", englishName: "French", flag: "🇫🇷" },
  ur: { nativeName: "اردو", englishName: "Urdu", flag: "🇵🇰" },
  fa: { nativeName: "فارسی", englishName: "Persian", flag: "🇮🇷" },
  bn: { nativeName: "বাংলা", englishName: "Bengali", flag: "🇧🇩" },
  ms: { nativeName: "Bahasa Melayu", englishName: "Malay", flag: "🇲🇾" },
  de: { nativeName: "Deutsch", englishName: "German", flag: "🇩🇪" },
  es: { nativeName: "Español", englishName: "Spanish", flag: "🇪🇸" },
  hi: { nativeName: "हिन्दी", englishName: "Hindi", flag: "🇮🇳" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function isBundled(locale: Locale): boolean {
  return (BUNDLED_LOCALES as readonly string[]).includes(locale);
}

export function isReserved(locale: Locale): boolean {
  return (RESERVED_LOCALES as readonly string[]).includes(locale);
}

export function dirFor(locale: Locale): "rtl" | "ltr" {
  return RTL_LOCALES.has(locale) ? "rtl" : "ltr";
}
