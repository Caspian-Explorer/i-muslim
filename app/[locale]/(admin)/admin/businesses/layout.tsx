import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { BusinessesTabsNav } from "@/components/admin/businesses/BusinessesTabsNav";

export default async function AdminBusinessesLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("businesses");
  return (
    <div>
      <PageHeader title={t("pageTitle")} />
      <div className="mb-4">
        <BusinessesTabsNav />
      </div>
      {children}
    </div>
  );
}
