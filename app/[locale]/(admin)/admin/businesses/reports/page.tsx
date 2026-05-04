import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BusinessReportsClient } from "@/components/admin/businesses/BusinessReportsClient";
import { fetchBusinessReports } from "@/lib/admin/data/business-reports";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("businesses.admin");
  return { title: t("reportsPageTitle") };
}

export default async function AdminBusinessReportsPage() {
  const { reports, source } = await fetchBusinessReports();
  return <BusinessReportsClient initialReports={reports} canPersist={source === "firestore"} />;
}
