import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/PageHeader";
import { ArticlesPageClient } from "@/components/admin/articles/ArticlesPageClient";
import { fetchArticles } from "@/lib/admin/data/articles";
import { fetchArticleCategories } from "@/lib/admin/data/article-categories";

export const metadata: Metadata = {
  title: "Articles & Blog",
};

export default async function ArticlesAdminPage() {
  const [{ items, source }, { categories }] = await Promise.all([
    fetchArticles(),
    fetchArticleCategories(),
  ]);
  return (
    <div>
      <PageHeader title="Articles & Blog" />
      <ArticlesPageClient
        initialItems={items}
        source={source}
        categories={categories}
      />
    </div>
  );
}
