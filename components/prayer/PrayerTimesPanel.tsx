"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download, Sunrise as SunriseIcon } from "lucide-react";
import {
  computeDailyTimes,
  formatPrayerTime,
  getCurrentPrayer,
  type Coords,
  type MadhabKey,
  type MethodKey,
  type PrayerKey,
  type PrayerOrSunrise,
} from "@/lib/prayer/engine";
import { pickDefaultMadhab, pickDefaultMethod } from "@/lib/prayer/methods";
import {
  detectClientTimeZone,
  fetchIpLocation,
  geolocationPermissionState,
  requestBrowserLocation,
} from "@/lib/prayer/location";
import { tzToCity } from "@/lib/prayer/tz-country";
import {
  readPrefs,
  usePrayerPrefs,
  writePrefs,
  type PrayerPrefs,
} from "@/lib/prayer/storage";
import { useNow } from "@/lib/prayer/ticker";
import { getHijriParts, formatGregorian } from "@/lib/admin/hijri";
import { NextPrayerPill } from "./NextPrayerPill";
import { PrayerTimesSettings } from "./PrayerTimesSettings";

export interface PanelInit {
  coords: Coords;
  method: MethodKey;
  madhab: MadhabKey;
  tz: string;
  city: string | null;
  countryCode: string | null;
  source: PrayerPrefs["source"];
}

interface Props {
  initial: PanelInit;
}

const ROWS: PrayerOrSunrise[] = [
  "fajr",
  "sunrise",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

function buildPrefsFromInit(init: PanelInit): PrayerPrefs {
  return {
    version: 1,
    method: init.method,
    madhab: init.madhab,
    coords: init.coords,
    city: init.city,
    countryCode: init.countryCode,
    tz: init.tz,
    source: init.source,
    updatedAt: new Date().toISOString(),
  };
}

async function resolveTzFromCoords(lat: number, lng: number): Promise<string> {
  try {
    const mod = await import("tz-lookup");
    const fn = (mod.default ?? mod) as (a: number, b: number) => string;
    return fn(lat, lng);
  } catch {
    return detectClientTimeZone();
  }
}

export function PrayerTimesPanel({ initial }: Props) {
  const t = useTranslations("prayer");
  const tPrayers = useTranslations("prayerTimes");
  const tHijri = useTranslations("hijri.months");
  const locale = useLocale();

  const stored = usePrayerPrefs();
  const fallback = useMemo(() => buildPrefsFromInit(initial), [initial]);
  const prefs = stored ?? fallback;
  const [autoBusy, setAutoBusy] = useState(false);

  // Auto-detect cascade — runs once on mount when no prefs are stored.
  // writePrefs() updates localStorage and dispatches a storage event, which
  // the usePrayerPrefs hook subscribes to, so the panel re-renders with the
  // detected location without needing local React state.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (readPrefs()) return;

    let cancelled = false;
    (async () => {
      setAutoBusy(true);
      try {
        const permState = await geolocationPermissionState();
        if (permState === "granted" && !cancelled) {
          try {
            const pos = await requestBrowserLocation({ enableHighAccuracy: false });
            if (cancelled) return;
            const c: Coords = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
            const tz = await resolveTzFromCoords(c.lat, c.lng);
            const tzCity = tzToCity(tz);
            const cc = tzCity?.countryCode ?? null;
            writePrefs({
              method: pickDefaultMethod(cc),
              madhab: pickDefaultMadhab(cc),
              coords: c,
              city: tzCity?.city ?? null,
              countryCode: cc,
              tz,
              source: "browser",
            });
            return;
          } catch {
            // fall through
          }
        }

        const ip = await fetchIpLocation();
        if (cancelled) return;
        if (ip) {
          writePrefs({
            method: pickDefaultMethod(ip.countryCode),
            madhab: pickDefaultMadhab(ip.countryCode),
            coords: ip.coords,
            city: ip.city,
            countryCode: ip.countryCode,
            tz: ip.tz,
            source: "auto-ip",
          });
          return;
        }

        const tz = detectClientTimeZone();
        const tzCity = tzToCity(tz);
        if (tzCity && !cancelled) {
          writePrefs({
            method: pickDefaultMethod(tzCity.countryCode),
            madhab: pickDefaultMadhab(tzCity.countryCode),
            coords: { lat: tzCity.lat, lng: tzCity.lng },
            city: tzCity.city,
            countryCode: tzCity.countryCode,
            tz,
            source: "auto-tz",
          });
        }
      } finally {
        if (!cancelled) setAutoBusy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const now = useNow(30_000);
  const renderDate = now ?? new Date();
  const renderDayKey = renderDate.toDateString();

  const today = useMemo(
    () =>
      computeDailyTimes({
        date: renderDate,
        coords: prefs.coords,
        method: prefs.method,
        madhab: prefs.madhab,
        tz: prefs.tz,
        highLatitudeRule: prefs.highLatitudeRule,
      }),
    // renderDayKey is the date stamp; we exclude renderDate so we don't
    // recompute on every 30s tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      renderDayKey,
      prefs.coords.lat,
      prefs.coords.lng,
      prefs.method,
      prefs.madhab,
      prefs.tz,
      prefs.highLatitudeRule,
    ],
  );

  const current = now ? getCurrentPrayer(now, today) : null;

  // Hijri + Gregorian header
  const hijri = getHijriParts(renderDate);
  const monthName = tHijri(String(hijri.monthIndex) as "1");
  const hijriStr = `${hijri.day} ${monthName} ${hijri.year}`;
  const gregorianStr = formatGregorian(renderDate, locale);

  const subtitle = prefs.city && prefs.countryCode
    ? t("pageSubtitleCity", {
        city: prefs.city,
        country: prefs.countryCode,
      })
    : prefs.city
      ? t("pageSubtitleCityOnly", { city: prefs.city })
      : t("pageSubtitleGeneric");

  const sourceLabel = sourceLabelKey(prefs.source);
  const showHighLatNotice = today.highLatRuleAuto && Math.abs(prefs.coords.lat) > 48;

  // Build ICS query
  const icsHref = `/prayer-times/calendar.ics?${new URLSearchParams({
    lat: String(prefs.coords.lat),
    lng: String(prefs.coords.lng),
    method: prefs.method,
    madhab: prefs.madhab,
    tz: prefs.tz,
    days: "30",
    ...(prefs.city ? { city: prefs.city } : {}),
  }).toString()}`;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            {t("pageTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            <span dir="rtl" lang="ar" className="font-arabic">
              {hijriStr}
            </span>
            <span className="mx-2 opacity-50">·</span>
            <span>{gregorianStr}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NextPrayerPill today={today} />
          <PrayerTimesSettings current={prefs} />
        </div>
      </header>

      <ul className="mt-6 divide-y divide-border rounded-md border border-border overflow-hidden">
        {ROWS.map((key) => {
          const isCurrent = current === key;
          const time = today[key];
          const label =
            key === "sunrise" ? tPrayers("sunrise") : tPrayers(key as PrayerKey);
          return (
            <li
              key={key}
              className={
                "flex items-center justify-between px-4 py-3 " +
                (isCurrent ? "bg-primary/5" : "")
              }
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                {key === "sunrise" && <SunriseIcon className="size-4 text-amber-500" />}
                <span className={isCurrent ? "text-primary" : ""}>{label}</span>
              </span>
              <span className="font-mono text-base tabular-nums">
                {formatPrayerTime(time, prefs.tz, locale)}
              </span>
            </li>
          );
        })}
      </ul>

      <footer className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          {autoBusy ? t("loading") : t(sourceLabel)}
          {showHighLatNotice && (
            <>
              <span className="mx-2 opacity-50">·</span>
              <span>
                {t("highLatNotice", {
                  rule: t(`highLatRule.${today.highLatRuleApplied}`),
                })}
              </span>
            </>
          )}
        </span>
        <a
          href={icsHref}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 hover:bg-muted"
          title={t("exportIcsHint")}
        >
          <Download className="size-3.5" />
          {t("exportIcs")}
        </a>
      </footer>
    </div>
  );
}

function sourceLabelKey(source: PrayerPrefs["source"]): string {
  switch (source) {
    case "browser":
      return "sourceBrowser";
    case "auto-ip":
      return "sourceIp";
    case "auto-tz":
      return "sourceTz";
    case "manual":
      return "sourceManual";
    default:
      return "sourceFallback";
  }
}
