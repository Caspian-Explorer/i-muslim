import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { CategorySlug } from "@/types/blog";

export function CategoryPill({ category }: { category: CategorySlug }) {
  const t = useTranslations("articles.categories");
  return (
    <Link href={`/articles?category=${category}`} className="no-underline">
      <Badge variant="accent">{t(category)}</Badge>
    </Link>
  );
}
