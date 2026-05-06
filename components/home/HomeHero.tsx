import { getTranslations } from "next-intl/server";
import { ArrowRight, BookOpen, ScrollText } from "lucide-react";
import { Link } from "@/i18n/navigation";

export async function HomeHero() {
  const t = await getTranslations("home");
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-selected via-background to-background px-6 py-14 text-center sm:px-10 sm:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06] dark:opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, var(--color-accent) 0, transparent 40%), radial-gradient(circle at 80% 80%, var(--color-primary) 0, transparent 45%)",
        }}
      />
      <p
        dir="rtl"
        lang="ar"
        className="font-arabic text-4xl text-accent sm:text-5xl"
      >
        {t("bismillah")}
      </p>
      <h1 className="mx-auto mt-6 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
        {t("headline")}
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
        {t("tagline")}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/quran"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <BookOpen className="size-4" />
          {t("hero.ctaQuran")}
          <ArrowRight className="size-3.5 rtl:rotate-180" />
        </Link>
        <Link
          href="/hadith"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent"
        >
          <ScrollText className="size-4" />
          {t("hero.ctaHadith")}
        </Link>
      </div>
    </section>
  );
}
