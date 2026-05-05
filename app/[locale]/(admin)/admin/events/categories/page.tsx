import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { CategoriesClient } from "@/components/admin/events/CategoriesClient";
import { fetchEventCategories } from "@/lib/admin/data/event-categories";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("events.admin");
  return { title: t("categoriesPageTitle") };
}

export default async function AdminEventCategoriesPage() {
  const t = await getTranslations("events.admin");
  const { categories, source } = await fetchEventCategories();
  return (
    <div>
      <PageHeader title={t("categoriesPageTitle")} />
      <CategoriesClient initialCategories={categories} canPersist={source === "firestore"} />
    </div>
  );
}
