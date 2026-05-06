import Link from "next/link";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/site/FavoriteButton";
import { getSiteConfig } from "@/lib/admin/data/site-config";
import type { ArticleListItem } from "@/types/blog";

export async function ArticleCard({
  article,
  signedIn,
}: {
  article: ArticleListItem;
  signedIn: boolean;
}) {
  const t = await getTranslations("articles");
  const tCat = await getTranslations("articles.categories");
  const locale = await getLocale();
  const siteConfig = await getSiteConfig();
  const heroUrl = article.heroImageUrl ?? siteConfig.articlePlaceholderUrl;
  const date = new Date(article.publishedAt);
  const href = `/articles/${article.slug}`;
  return (
    <div className="group relative flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <Link href={href} className="absolute inset-0 z-0" aria-label={article.title} />
      <div className="absolute right-3 top-3 z-10">
        <FavoriteButton
          itemType="article"
          itemId={article.id}
          itemMeta={{
            title: article.title,
            subtitle: article.excerpt,
            href,
            thumbnail: article.heroImageUrl ?? null,
            locale,
          }}
          signedIn={signedIn}
          iconOnly
        />
      </div>
      {heroUrl && (
        <div className="relative z-0 aspect-[16/9] overflow-hidden rounded-md bg-muted">
          <Image
            src={heroUrl}
            alt={article.heroImageAlt ?? ""}
            fill
            sizes="(min-width: 768px) 384px, 100vw"
            className="object-cover transition-transform group-hover:scale-[1.02]"
          />
        </div>
      )}
      <div className="relative z-0 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="accent">{tCat(article.category)}</Badge>
        <time dateTime={article.publishedAt}>{date.toLocaleDateString()}</time>
        <span aria-hidden>·</span>
        <span>{t("readingMinutes", { count: article.readingMinutes })}</span>
      </div>
      <h3 className="relative z-0 text-lg font-semibold text-foreground group-hover:text-primary">
        {article.title}
      </h3>
      <p className="relative z-0 text-sm text-muted-foreground line-clamp-3">
        {article.excerpt}
      </p>
    </div>
  );
}
