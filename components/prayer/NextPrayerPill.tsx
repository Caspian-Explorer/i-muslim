"use client";

import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import { useNow } from "@/lib/prayer/ticker";
import {
  computeDailyTimes,
  formatCountdown,
  getNextPrayer,
  type DailyTimes,
} from "@/lib/prayer/engine";

interface Props {
  today: DailyTimes;
  className?: string;
}

export function NextPrayerPill({ today, className }: Props) {
  const now = useNow(30_000);
  const t = useTranslations();

  if (!now) {
    return (
      <span
        className={
          "inline-flex items-center gap-1.5 text-sm text-muted-foreground " +
          (className ?? "")
        }
      >
        <Clock className="size-4" />—
      </span>
    );
  }

  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = computeDailyTimes({
    date: tomorrowDate,
    coords: today.coords,
    method: today.method,
    madhab: today.madhab,
    tz: today.tz,
    highLatitudeRule: today.highLatRuleAuto ? undefined : today.highLatRuleApplied,
  });

  const next = getNextPrayer(now, today, tomorrow);
  const prayerName = t(`prayerTimes.${next.key}`);
  const countdown = formatCountdown(next.minutesUntil);

  const labelKey = next.isTomorrow ? "prayer.tomorrowFajrIn" : "prayer.nextIn";

  return (
    <span
      className={
        "ui-selected inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm " +
        (className ?? "")
      }
    >
      <Clock className="size-3.5" />
      <span className="font-medium">
        {t(labelKey, { prayer: prayerName, countdown })}
      </span>
    </span>
  );
}
