"use client";

import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PrayerPills } from "./PrayerPills";
import { usePrayerTimes } from "@/lib/prayer/use-prayer-times";

export function PrayerTimesBar() {
  const t = useTranslations("prayerBar");
  const { effectivePrefs } = usePrayerTimes();

  const city = effectivePrefs?.city ?? null;
  const cc = effectivePrefs?.countryCode ?? null;
  const locationLabel = city
    ? cc
      ? `${city}, ${cc}`
      : city
    : t("viewAll");

  return (
    <div className="border-b border-border bg-muted/40 text-foreground">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-1.5 overflow-x-auto whitespace-nowrap">
        <PrayerPills className="flex-1" />
        <Link
          href="/prayer-times"
          className="ml-auto inline-flex shrink-0 items-center gap-0.5 rounded-md px-2 py-1 text-xs sm:text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={t("viewAllAria")}
        >
          <span className="truncate max-w-[10rem]">{locationLabel}</span>
          <ChevronRight className="size-3.5 shrink-0 rtl:rotate-180" />
        </Link>
      </div>
    </div>
  );
}
