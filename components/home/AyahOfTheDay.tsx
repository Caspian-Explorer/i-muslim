import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, BookOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getAyahOfTheDay } from "@/lib/quran/of-the-day";

export async function AyahOfTheDay() {
  const [t, locale] = await Promise.all([
    getTranslations("home.ayahOfDay"),
    getLocale(),
  ]);
  const ayah = await getAyahOfTheDay(new Date(), locale);
  if (!ayah) return null;
  const reference = `${ayah.surahName} · ${t("ayahLabel", { number: ayah.ayah })}`;
  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-accent">
      <header className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-accent">
        <BookOpen className="size-3.5" />
        <span>{t("heading")}</span>
      </header>
      <p
        dir="rtl"
        lang="ar"
        className="font-arabic mt-5 text-2xl leading-loose text-foreground sm:text-3xl"
      >
        {ayah.arabic}
      </p>
      {ayah.translation && (
        <p
          lang={ayah.translationLang ?? "en"}
          className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base"
        >
          {ayah.translation}
        </p>
      )}
      <footer className="mt-6 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{reference}</p>
        <Link
          href={`/quran/${ayah.surah}#ayah-${ayah.ayah}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {t("openSurah")}
          <ArrowRight className="size-3 rtl:rotate-180" />
        </Link>
      </footer>
    </article>
  );
}
