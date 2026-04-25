"use client";

import { useLocale, useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import {
  computeDailyTimes,
  formatCountdown,
  formatPrayerTime,
  getCurrentPrayer,
  getNextPrayer,
  type Coords,
  type PrayerKey,
} from "@/lib/prayer/engine";
import {
  pickDefaultMadhab,
  pickDefaultMethod,
} from "@/lib/prayer/methods";
import { MECCA_FALLBACK } from "@/lib/prayer/location";
import { usePrayerPrefs } from "@/lib/prayer/storage";
import { useNow } from "@/lib/prayer/ticker";

const ROW_KEYS: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

const FALLBACK = {
  coords: MECCA_FALLBACK.coords as Coords,
  method: pickDefaultMethod(MECCA_FALLBACK.countryCode),
  madhab: pickDefaultMadhab(MECCA_FALLBACK.countryCode),
  tz: MECCA_FALLBACK.tz,
};

export function PrayerTimesWidget() {
  const now = useNow(30_000);
  const t = useTranslations("prayerTimes");
  const locale = useLocale();
  const prefs = usePrayerPrefs();

  if (!now) {
    return <div className="text-sm text-muted-foreground">—</div>;
  }

  const config = prefs ?? {
    coords: FALLBACK.coords,
    method: FALLBACK.method,
    madhab: FALLBACK.madhab,
    tz: FALLBACK.tz,
    highLatitudeRule: undefined,
  };

  const today = computeDailyTimes({
    date: now,
    coords: config.coords,
    method: config.method,
    madhab: config.madhab,
    tz: config.tz,
    highLatitudeRule: config.highLatitudeRule,
  });
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = computeDailyTimes({
    date: tomorrowDate,
    coords: config.coords,
    method: config.method,
    madhab: config.madhab,
    tz: config.tz,
    highLatitudeRule: config.highLatitudeRule,
  });

  const next = getNextPrayer(now, today, tomorrow);
  const current = getCurrentPrayer(now, today);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
      <Clock className="size-4 text-muted-foreground shrink-0" />
      <span className="text-sm">
        <span className="text-muted-foreground">{t("next")}</span>{" "}
        <span className="font-medium text-foreground">{t(next.key)}</span>{" "}
        <span className="font-mono tabular-nums text-muted-foreground">
          {formatPrayerTime(next.at, config.tz, locale)} ·{" "}
          {t("in", { countdown: formatCountdown(next.minutesUntil) })}
        </span>
      </span>
      <div className="ms-auto hidden gap-2 md:flex">
        {ROW_KEYS.map((key) => (
          <div
            key={key}
            className={
              "flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs tabular-nums " +
              (key === current
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground")
            }
          >
            <span>{t(key)}</span>
            <span className="font-mono">
              {formatPrayerTime(today[key], config.tz, locale)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
