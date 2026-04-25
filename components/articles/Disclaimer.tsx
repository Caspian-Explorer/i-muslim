import { getTranslations } from "next-intl/server";

export async function Disclaimer() {
  const t = await getTranslations("articles");
  return (
    <aside
      role="note"
      className="mt-10 rounded-md border border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground"
    >
      {t("disclaimer")}
    </aside>
  );
}
