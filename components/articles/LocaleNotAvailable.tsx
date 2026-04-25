import { getTranslations } from "next-intl/server";
import { Globe } from "lucide-react";

export async function LocaleNotAvailable() {
  const t = await getTranslations("articles.localeNotAvailable");
  return (
    <div className="rounded-lg border border-border bg-card px-6 py-12 text-center">
      <div className="mx-auto inline-flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Globe className="size-5" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-foreground">{t("title")}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {t("body")}
      </p>
    </div>
  );
}
