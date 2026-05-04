import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BusinessesPageClient } from "@/components/admin/businesses/BusinessesPageClient";
import { fetchBusinesses, fetchBusinessSubmissions } from "@/lib/admin/data/businesses";
import { fetchCategories, fetchAmenities, fetchCertBodies } from "@/lib/admin/data/business-taxonomies";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("businesses");
  return { title: t("pageTitle") };
}

export default async function AdminBusinessesPage() {
  const [{ businesses, source }, { submissions }, { categories }, { amenities }, { certBodies }] =
    await Promise.all([
      fetchBusinesses(),
      fetchBusinessSubmissions(),
      fetchCategories(),
      fetchAmenities(),
      fetchCertBodies(),
    ]);

  const pendingSubmissions = submissions.filter((s) => s.status === "pending_review");

  return (
    <BusinessesPageClient
      initialBusinesses={businesses}
      pendingSubmissions={pendingSubmissions}
      categories={categories}
      amenities={amenities}
      certBodies={certBodies}
      canPersist={source === "firestore"}
    />
  );
}
