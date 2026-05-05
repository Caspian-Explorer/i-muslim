import type { Mosque, PrayerKey } from "@/types/mosque";
import { computeAdhan, formatTimeInZone } from "./adhan";

export interface ResolvedAdhanRow {
  prayer: PrayerKey;
  adhanLabel: string | null;
}

export interface ResolveOptions {
  date?: Date;
  locale?: string;
  includeJumuah?: boolean;
}

export function resolveAdhan(
  mosque: Pick<Mosque, "location" | "timezone" | "prayerCalc">,
  opts: ResolveOptions = {},
): ResolvedAdhanRow[] {
  const day = opts.date ?? new Date();
  const locale = opts.locale ?? "en-US";
  const adhan = computeAdhan(mosque, day);
  const tz = mosque.timezone ?? "UTC";

  const rows: ResolvedAdhanRow[] = [
    { prayer: "fajr", adhanLabel: formatTimeInZone(adhan.fajr, tz, locale) },
    { prayer: "dhuhr", adhanLabel: formatTimeInZone(adhan.dhuhr, tz, locale) },
    { prayer: "asr", adhanLabel: formatTimeInZone(adhan.asr, tz, locale) },
    { prayer: "maghrib", adhanLabel: formatTimeInZone(adhan.maghrib, tz, locale) },
    { prayer: "isha", adhanLabel: formatTimeInZone(adhan.isha, tz, locale) },
  ];

  if ((opts.includeJumuah ?? true) && isFridayInZone(day, tz)) {
    rows.push({ prayer: "jumuah", adhanLabel: formatTimeInZone(adhan.dhuhr, tz, locale) });
  }

  return rows;
}

function isFridayInZone(date: Date, timezone: string): boolean {
  const day = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: timezone,
  }).format(date);
  return day.toLowerCase().startsWith("fri");
}
