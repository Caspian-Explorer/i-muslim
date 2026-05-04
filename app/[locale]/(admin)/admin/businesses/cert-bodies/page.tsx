import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CertBodiesClient } from "@/components/admin/businesses/CertBodiesClient";
import { fetchCertBodies } from "@/lib/admin/data/business-taxonomies";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("businesses.admin");
  return { title: t("certBodiesPageTitle") };
}

export default async function AdminCertBodiesPage() {
  const { certBodies, source } = await fetchCertBodies();
  return <CertBodiesClient initialCertBodies={certBodies} canPersist={source === "firestore"} />;
}
