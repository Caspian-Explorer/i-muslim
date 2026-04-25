import "server-only";
import { getDb } from "@/lib/firebase/admin";
import { MOCK_ARTICLES } from "@/lib/admin/mock/articles";
import { normalizeArticle } from "@/lib/blog/data";
import type { AdminArticleRow, Article } from "@/types/blog";

export type ArticlesResult = {
  items: AdminArticleRow[];
  source: "firestore" | "mock";
};

function toRow(article: Article): AdminArticleRow {
  const translations: AdminArticleRow["translations"] = {};
  for (const [locale, t] of Object.entries(article.translations)) {
    if (!t) continue;
    translations[locale as keyof AdminArticleRow["translations"]] = {
      title: t.title,
      slug: t.slug,
      status: t.status,
      publishedAt: t.publishedAt,
    };
  }
  return {
    id: article.id,
    category: article.category,
    heroImageUrl: article.heroImageUrl,
    authorId: article.authorId,
    publishedLocales: article.publishedLocales,
    latestPublishedAt: article.latestPublishedAt,
    updatedAt: article.updatedAt,
    createdAt: article.createdAt,
    translations,
  };
}

export async function fetchArticles(): Promise<ArticlesResult> {
  const db = getDb();
  if (!db) return { items: MOCK_ARTICLES, source: "mock" };
  try {
    const snap = await db
      .collection("articles")
      .orderBy("updatedAt", "desc")
      .limit(500)
      .get();
    if (snap.empty) return { items: [], source: "firestore" };
    const items = snap.docs.map((d) => toRow(normalizeArticle(d.id, d.data())));
    return { items, source: "firestore" };
  } catch (err) {
    console.warn("[admin/data/articles] Firestore read failed, falling back to mock:", err);
    return { items: MOCK_ARTICLES, source: "mock" };
  }
}

export async function fetchArticleById(id: string): Promise<Article | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const doc = await db.collection("articles").doc(id).get();
    if (!doc.exists) return null;
    return normalizeArticle(doc.id, doc.data() as Record<string, unknown>);
  } catch (err) {
    console.warn("[admin/data/articles] fetchArticleById failed:", err);
    return null;
  }
}
