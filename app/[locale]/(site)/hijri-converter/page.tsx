import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { HijriDateConverter } from "@/components/hijri-converter/HijriDateConverter";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hijriConverter");
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default function HijriConverterPage() {
  return <HijriDateConverter />;
}
