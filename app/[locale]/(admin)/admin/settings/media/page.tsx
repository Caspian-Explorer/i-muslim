import { getTranslations } from "next-intl/server";
import { MediaForm } from "@/components/admin/settings/MediaForm";
import { getSiteConfig } from "@/lib/admin/data/site-config";

export default async function Page() {
  const [config, t] = await Promise.all([
    getSiteConfig(),
    getTranslations("adminSettings.media"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <MediaForm
        initial={{
          logo: { storagePath: config.logoStoragePath, url: config.logoUrl },
          favicon: {
            storagePath: config.faviconStoragePath,
            url: config.faviconUrl,
          },
          og: {
            storagePath: config.ogImageStoragePath,
            url: config.ogImageUrl,
          },
          articlePlaceholder: {
            storagePath: config.articlePlaceholderStoragePath,
            url: config.articlePlaceholderUrl,
          },
        }}
      />
    </div>
  );
}
