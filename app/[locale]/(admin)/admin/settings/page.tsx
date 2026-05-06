import { getTranslations } from "next-intl/server";
import { SiteIdentityForm } from "@/components/admin/settings/SiteIdentityForm";
import { getSiteConfig } from "@/lib/admin/data/site-config";

export default async function Page() {
  const [config, t] = await Promise.all([
    getSiteConfig(),
    getTranslations("adminSettings.general"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <SiteIdentityForm
        initial={{ siteName: config.siteName, tagline: config.tagline }}
      />
    </div>
  );
}
