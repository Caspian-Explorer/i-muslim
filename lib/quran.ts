import type {
  ChaptersResponse,
  Chapter,
  VersesByChapterResponse,
  Verse,
  QuranSearchResponse,
  QuranSearchResult,
} from "@/types/quran";
import { QURAN_TRANSLATION_IDS } from "./translations";
import type { LangCode } from "./translations";

const BASE = "https://api.quran.com/api/v4";

async function fetchQuran<T>(
  path: string,
  revalidate: number = 60 * 60 * 24,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    next: { revalidate },
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(
      `quran.com ${path} failed: ${res.status} ${res.statusText}`,
    );
  }
  return (await res.json()) as T;
}

export function translationIdsForLangs(langs: LangCode[]): number[] {
  const ids: number[] = [];
  for (const lang of langs) {
    if (lang === "ar") continue;
    const id = QURAN_TRANSLATION_IDS[lang];
    if (id) ids.push(id);
  }
  return ids;
}

export async function getChapters(): Promise<Chapter[]> {
  const data = await fetchQuran<ChaptersResponse>(
    `/chapters?language=en`,
    60 * 60 * 24 * 30,
  );
  return data.chapters;
}

export async function getChapter(id: number): Promise<Chapter> {
  const chapters = await getChapters();
  const chapter = chapters.find((c) => c.id === id);
  if (!chapter) throw new Error(`Chapter ${id} not found`);
  return chapter;
}

export async function getVerses(
  chapterId: number,
  langs: LangCode[],
): Promise<Verse[]> {
  const translations = translationIdsForLangs(langs);
  const params = new URLSearchParams({
    fields: "text_uthmani",
    per_page: "300",
  });
  if (translations.length > 0) {
    params.set("translations", translations.join(","));
  }
  const data = await fetchQuran<VersesByChapterResponse>(
    `/verses/by_chapter/${chapterId}?${params.toString()}`,
  );
  return data.verses;
}

export async function searchQuran(
  q: string,
  langs: LangCode[],
): Promise<QuranSearchResult[]> {
  if (!q.trim()) return [];
  const translations = translationIdsForLangs(langs);
  const params = new URLSearchParams({
    q,
    size: "20",
    language: "en",
  });
  if (translations.length > 0) {
    params.set("translations", translations.join(","));
  }
  const data = await fetchQuran<QuranSearchResponse>(
    `/search?${params.toString()}`,
    60 * 10,
  );
  return data.search.results;
}
