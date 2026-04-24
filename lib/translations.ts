export type LangCode = "ar" | "en" | "ru" | "az";

export const ALL_LANGS: readonly LangCode[] = ["ar", "en", "ru", "az"] as const;

export const LANG_LABELS: Record<LangCode, string> = {
  ar: "Arabic",
  en: "English",
  ru: "Russian",
  az: "Azerbaijani",
};

// Verified translation resource IDs on api.quran.com/api/v4/resources/translations
export const QURAN_TRANSLATION_IDS: Record<Exclude<LangCode, "ar">, number> = {
  en: 20, // Saheeh International
  ru: 45, // Elmir Kuliev
  az: 75, // Alikhan Musayev
};

export const QURAN_TRANSLATION_NAMES: Record<Exclude<LangCode, "ar">, string> =
  {
    en: "Saheeh International",
    ru: "Эльмир Кулиев",
    az: "Əlixan Musayev",
  };

// fawazahmed0/hadith-api editions per language.
// key: LangCode, value: set of collection slugs that have an edition.
export const HADITH_LANG_COVERAGE: Record<
  Exclude<LangCode, "ar">,
  ReadonlySet<string>
> = {
  en: new Set([
    "bukhari",
    "muslim",
    "abudawud",
    "tirmidhi",
    "nasai",
    "ibnmajah",
    "malik",
    "nawawi",
    "qudsi",
  ]),
  ru: new Set(["bukhari", "muslim", "abudawud"]),
  az: new Set(), // no Azerbaijani hadith translations available
};

const DEFAULT_LANGS: LangCode[] = ["ar", "en"];

export function parseLangsParam(raw: string | undefined | null): LangCode[] {
  if (!raw) return [...DEFAULT_LANGS];
  const parts = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is LangCode => (ALL_LANGS as readonly string[]).includes(s));
  const uniq = Array.from(new Set<LangCode>(parts));
  if (!uniq.includes("ar")) uniq.unshift("ar");
  return uniq.length > 1 ? uniq : [...DEFAULT_LANGS];
}

export function serializeLangs(langs: LangCode[]): string {
  return langs.join(",");
}

export function hadithLangsWithFallback(langs: LangCode[], collection: string) {
  // Returns ordered list of { requested, actual } per non-Arabic language,
  // applying English fallback when the requested translation is unavailable.
  const out: Array<{ requested: LangCode; actual: LangCode | null }> = [];
  for (const lang of langs) {
    if (lang === "ar") continue;
    const coverage = HADITH_LANG_COVERAGE[lang];
    if (coverage.has(collection)) {
      out.push({ requested: lang, actual: lang });
    } else if (
      lang !== "en" &&
      HADITH_LANG_COVERAGE.en.has(collection) &&
      !out.some((e) => e.actual === "en")
    ) {
      out.push({ requested: lang, actual: "en" });
    } else {
      out.push({ requested: lang, actual: null });
    }
  }
  return out;
}
