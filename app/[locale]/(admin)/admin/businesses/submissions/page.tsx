import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BusinessSubmissionsClient } from "@/components/admin/businesses/BusinessSubmissionsClient";
import { fetchBusinessSubmissions } from "@/lib/admin/data/businesses";
import { fetchCategories } from "@/lib/admin/data/business-taxonomies";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("businesses.admin.submissions");
  return { title: t("queueTitle") };
}

export default async function AdminBusinessSubmissionsPage() {
  const [{ submissions, source }, { categories }] = await Promise.all([
    fetchBusinessSubmissions(),
    fetchCategories(),
  ]);
  return (
    <BusinessSubmissionsClient
      initialSubmissions={submissions}
      categories={categories}
      canPersist={source === "firestore"}
    />
  );
}
