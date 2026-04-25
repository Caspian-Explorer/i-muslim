import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ArticleListItem } from "@/types/blog";

export async function RelatedArticles({
  articles,
}: {
  articles: ArticleListItem[];
}) {
  if (articles.length === 0) return null;
  const t = await getTranslations("articles");
  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        {t("relatedArticles")}
      </h2>
      <ul className="space-y-3">
        {articles.map((article) => (
          <li key={article.id}>
            <Link
              href={`/articles/${article.slug}`}
              className="block rounded-md border border-border bg-card px-4 py-3 hover:border-primary/40"
            >
              <div className="font-medium text-foreground">{article.title}</div>
              <div className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {article.excerpt}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
