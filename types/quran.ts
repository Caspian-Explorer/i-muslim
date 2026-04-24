export type Chapter = {
  id: number;
  revelation_place: "makkah" | "madinah";
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: [number, number];
  translated_name: { language_name: string; name: string };
};

export type VerseTranslation = {
  id: number;
  resource_id: number;
  text: string;
};

export type Verse = {
  id: number;
  verse_number: number;
  verse_key: string; // e.g. "1:1"
  text_uthmani: string;
  translations: VerseTranslation[];
};

export type ChaptersResponse = { chapters: Chapter[] };
export type VersesByChapterResponse = {
  verses: Verse[];
  pagination: {
    per_page: number;
    current_page: number;
    next_page: number | null;
    total_pages: number;
    total_records: number;
  };
};

export type QuranSearchResult = {
  verse_key: string;
  text: string;
  translations: Array<{ id: number; text: string; resource_id?: number }>;
};

export type QuranSearchResponse = {
  search: {
    query: string;
    total_results: number;
    current_page: number;
    total_pages: number;
    results: QuranSearchResult[];
  };
};
