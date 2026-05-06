import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { FacilitiesClient } from "@/components/admin/mosques/FacilitiesClient";
import { fetchMosqueFacilities } from "@/lib/admin/data/mosque-facilities";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("mosquesAdmin.facilities");
  return { title: t("pageTitle") };
}

export default async function AdminMosqueFacilitiesPage() {
  const [{ facilities, source }, t] = await Promise.all([
    fetchMosqueFacilities(),
    getTranslations("mosquesAdmin.facilities"),
  ]);
  return (
    <div>
      <PageHeader title={t("pageTitle")} />
      <FacilitiesClient
        initialFacilities={facilities}
        canPersist={source === "firestore"}
      />
    </div>
  );
}
