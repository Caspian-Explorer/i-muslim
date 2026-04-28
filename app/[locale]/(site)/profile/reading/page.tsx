import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BookOpen, BookOpenCheck, Library } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getSiteSession } from "@/lib/auth/session";
import { getReadingProgress } from "@/lib/profile/data";
import { formatRelative } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reading");
  return { title: t("title") };
}

export default async function ReadingProgressPage() {
  const session = await getSiteSession();
  if (!session) redirect("/login?callbackUrl=/profile/reading");

  const t = await getTranslations("reading");
  const tNav = await getTranslations("profileNav");
  const progress = await getReadingProgress(session.uid);

  const cards: Array<{
    icon: typeof BookOpenCheck;
    label: string;
    title: string;
    href: string;
    viewedAt: string;
  }> = [];

  if (progress.lastQuranAyah) {
    cards.push({
      icon: BookOpenCheck,
      label: t("lastQuranAyah"),
      title: progress.lastQuranAyah.verseKey,
      href: `/quran/${progress.lastQuranAyah.surah}#${progress.lastQuranAyah.verseKey}`,
      viewedAt: progress.lastQuranAyah.viewedAt,
    });
  }
  if (progress.lastSurah) {
    cards.push({
      icon: BookOpen,
      label: t("lastSurah"),
      title: `Surah ${progress.lastSurah.surah}`,
      href: `/quran/${progress.lastSurah.surah}`,
      viewedAt: progress.lastSurah.viewedAt,
    });
  }
  if (progress.lastHadith) {
    cards.push({
      icon: Library,
      label: t("lastHadith"),
      title: `${progress.lastHadith.collection} · Book ${progress.lastHadith.book} · #${progress.lastHadith.number}`,
      href: `/hadith/${progress.lastHadith.collection}/${progress.lastHadith.book}#hadith-${progress.lastHadith.number}`,
      viewedAt: progress.lastHadith.viewedAt,
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {tNav("items.reading")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("pageDescription")}</p>
      </header>

      {cards.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center text-muted-foreground">
          {t("empty")}
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <li
                key={card.label}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5"
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <Icon className="size-4" />
                  {card.label}
                </div>
                <div className="text-lg font-semibold text-foreground">{card.title}</div>
                <div className="text-xs text-muted-foreground">
                  {t("viewedAt", { when: formatRelative(card.viewedAt) })}
                </div>
                <Link
                  href={card.href}
                  className="inline-flex w-fit items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {t("resume")}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
