import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/PageHeader";
import { CategoriesClient } from "@/components/admin/articles/CategoriesClient";
import { fetchArticleCategories } from "@/lib/admin/data/article-categories";

export const metadata: Metadata = {
  title: "Article categories",
};

export default async function AdminArticleCategoriesPage() {
  const { categories, source } = await fetchArticleCategories();
  return (
    <div>
      <PageHeader
        title="Article categories"
        subtitle="Curate the categories admins can pick when creating an article."
      />
      <CategoriesClient initialCategories={categories} canPersist={source === "firestore"} />
    </div>
  );
}
