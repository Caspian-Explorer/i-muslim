"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Clock3 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  formatPrayerTime,
  type PrayerOrSunrise,
} from "@/lib/prayer/engine";
import { usePrayerTimes } from "@/lib/prayer/use-prayer-times";

const ROWS: PrayerOrSunrise[] = [
  "fajr",
  "sunrise",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

export function HomePrayerTimes() {
  const t = useTranslations("home.todayPrayer");
  const tPrayers = useTranslations("prayerTimes");
  const locale = useLocale();
  const { effectivePrefs, today, next } = usePrayerTimes();

  const tz = effectivePrefs?.tz ?? "UTC";
  const city = effectivePrefs?.city ?? null;
  const cc = effectivePrefs?.countryCode ?? null;
  const location = city ? (cc ? `${city}, ${cc}` : city) : null;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Clock3 className="size-4 text-accent" />
            {t("heading")}
          </h2>
          {location && (
            <p className="mt-1 text-xs text-muted-foreground">{location}</p>
          )}
        </div>
        <Link
          href="/prayer-times"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {t("viewAll")}
          <ArrowRight className="size-3 rtl:rotate-180" />
        </Link>
      </header>
      <ul className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {ROWS.map((key) => {
          const isNext = next?.key === key && !next.isTomorrow;
          const time = today ? formatPrayerTime(today[key], tz, locale) : "—";
          return (
            <li
              key={key}
              className={
                "flex flex-col items-center rounded-lg border px-3 py-3 text-center transition-colors " +
                (isNext
                  ? "ui-selected border-transparent"
                  : "border-border bg-background")
              }
              aria-current={isNext ? "true" : undefined}
            >
              <span
                className={
                  "text-[10px] uppercase tracking-wide " +
                  (isNext ? "" : "text-muted-foreground")
                }
              >
                {tPrayers(key)}
              </span>
              <span className="mt-1 font-mono text-sm tabular-nums sm:text-base">
                {time}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
