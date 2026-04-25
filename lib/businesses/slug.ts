const TRANSLITERATIONS: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u",
  ä: "a", ë: "e", ï: "i", ÿ: "y",
  á: "a", é: "e", í: "i", ó: "o", ú: "u",
  à: "a", è: "e", ì: "i", ò: "o", ù: "u",
  â: "a", ê: "e", î: "i", ô: "o", û: "u",
  ñ: "n", ã: "a", õ: "o",
  ø: "o", å: "a", æ: "ae",
  ß: "ss",
};

export function transliterate(input: string): string {
  return Array.from(input.toLowerCase())
    .map((ch) => TRANSLITERATIONS[ch] ?? ch)
    .join("")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function slugify(name: string, city: string): string {
  const namePart = transliterate(name);
  const cityPart = transliterate(city);
  if (namePart && cityPart) return `${namePart}-${cityPart}`;
  if (namePart) return namePart;
  if (cityPart) {
    const suffix = Math.random().toString(36).slice(2, 8);
    return `${cityPart}-${suffix}`;
  }
  return `business-${Math.random().toString(36).slice(2, 10)}`;
}

export function withCollisionSuffix(base: string, attempt: number): string {
  if (attempt <= 1) return base;
  return `${base}-${attempt}`;
}

export function buildSearchTokens(name: string, city: string): string[] {
  const source = `${name} ${city}`;
  const tokens = transliterate(source)
    .split("-")
    .filter((t) => t.length >= 2);
  return Array.from(new Set(tokens)).slice(0, 30);
}
