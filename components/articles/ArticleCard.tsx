import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import type { ArticleListItem } from "@/types/blog";

export async function ArticleCard({ article }: { article: ArticleListItem }) {
  const t = await getTranslations("articles");
  const tCat = await getTranslations("articles.categories");
  const date = new Date(article.publishedAt);
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
    >
      {article.heroImageUrl && (
        <div className="relative aspect-[16/9] overflow-hidden rounded-md bg-muted">
          <Image
            src={article.heroImageUrl}
            alt={article.heroImageAlt ?? ""}
            fill
            sizes="(min-width: 768px) 384px, 100vw"
            className="object-cover transition-transform group-hover:scale-[1.02]"
          />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="accent">{tCat(article.category)}</Badge>
        <time dateTime={article.publishedAt}>{date.toLocaleDateString()}</time>
        <span aria-hidden>·</span>
        <span>{t("readingMinutes", { count: article.readingMinutes })}</span>
      </div>
      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">
        {article.title}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-3">{article.excerpt}</p>
    </Link>
  );
}
