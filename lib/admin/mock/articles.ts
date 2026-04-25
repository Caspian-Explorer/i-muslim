import type { AdminArticleRow } from "@/types/blog";

const NOW = Date.now();
const day = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

export const MOCK_ARTICLES: AdminArticleRow[] = [
  {
    id: "mock-asr-hanafi-shafii",
    category: "prayer-times",
    heroImageUrl: null,
    authorId: "fuad",
    publishedLocales: ["en"],
    latestPublishedAt: day(2),
    updatedAt: day(2),
    createdAt: day(10),
    translations: {
      en: {
        title: "Asr time: Hanafi vs Shafi'i, explained",
        slug: "asr-hanafi-vs-shafii",
        status: "published",
        publishedAt: day(2),
      },
    },
  },
  {
    id: "mock-ramadan-2026",
    category: "hijri",
    heroImageUrl: null,
    authorId: "fuad",
    publishedLocales: ["en"],
    latestPublishedAt: day(7),
    updatedAt: day(7),
    createdAt: day(20),
    translations: {
      en: {
        title: "When does Ramadan 2026 start? (and how the date is decided)",
        slug: "when-does-ramadan-2026-start",
        status: "published",
        publishedAt: day(7),
      },
    },
  },
  {
    id: "mock-qibla-bearing",
    category: "qibla",
    heroImageUrl: null,
    authorId: "fuad",
    publishedLocales: [],
    latestPublishedAt: null,
    updatedAt: day(1),
    createdAt: day(3),
    translations: {
      en: {
        title: "How Qibla is calculated, in plain English",
        slug: "how-qibla-is-calculated",
        status: "draft",
        publishedAt: null,
      },
    },
  },
];
