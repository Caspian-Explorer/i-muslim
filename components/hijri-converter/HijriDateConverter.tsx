"use client";

import * as React from "react";
import { CalendarDays, RotateCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import umalqura from "@umalqura/core";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getHijriParts, formatGregorian } from "@/lib/admin/hijri";

const MIN_HY = umalqura.min.hy;
const MAX_HY = umalqura.max.hy;

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIsoDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function HijriDateConverter() {
  const t = useTranslations("hijriConverter");
  const tMonths = useTranslations("hijri.months");
  const locale = useLocale();

  const today = React.useMemo(() => new Date(), []);
  const todayHijri = React.useMemo(() => getHijriParts(today), [today]);

  const [gregInput, setGregInput] = React.useState<string>(() =>
    toIsoDate(today),
  );
  const [hYear, setHYear] = React.useState<number>(todayHijri.year);
  const [hMonth, setHMonth] = React.useState<number>(todayHijri.monthIndex);
  const [hDay, setHDay] = React.useState<number>(todayHijri.day);

  const gregToHijri = React.useMemo(() => {
    const d = parseIsoDate(gregInput);
    if (!d) return null;
    const h = getHijriParts(d);
    const weekday = d.toLocaleDateString(locale, { weekday: "long" });
    return { ...h, weekday };
  }, [gregInput, locale]);

  const hijriToGreg = React.useMemo<
    | { date: Date; weekday: string; longDate: string }
    | { error: "outOfRange" | "invalidDate" }
    | null
  >(() => {
    if (!Number.isFinite(hYear) || !Number.isFinite(hMonth) || !Number.isFinite(hDay)) {
      return null;
    }
    if (hYear < MIN_HY || hYear > MAX_HY) return { error: "outOfRange" };
    if (hMonth < 1 || hMonth > 12) return { error: "invalidDate" };
    if (hDay < 1 || hDay > 30) return { error: "invalidDate" };
    try {
      const result = umalqura(hYear, hMonth, hDay);
      if (result.hy !== hYear || result.hm !== hMonth || result.hd !== hDay) {
        return { error: "invalidDate" };
      }
      const date = result.date;
      return {
        date,
        weekday: date.toLocaleDateString(locale, { weekday: "long" }),
        longDate: date.toLocaleDateString(locale, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      };
    } catch {
      return { error: "outOfRange" };
    }
  }, [hYear, hMonth, hDay, locale]);

  const monthOptions = React.useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: tMonths(String(i + 1)),
      })),
    [tMonths],
  );

  const handleResetGreg = () => setGregInput(toIsoDate(new Date()));
  const handleResetHijri = () => {
    const fresh = getHijriParts(new Date());
    setHYear(fresh.year);
    setHMonth(fresh.monthIndex);
    setHDay(fresh.day);
  };

  const todayWeekday = today.toLocaleDateString(locale, { weekday: "long" });
  const todayLong = formatGregorian(today, locale);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground italic">{t("subtitle")}</p>
      </header>

      <Card className="mb-6 p-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <CalendarDays className="size-3.5" />
          <span>{t("today.label")}</span>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("gregorianToHijri.dateLabel")}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {todayLong} {t("today.ceSuffix")}
            </p>
            <p className="text-xs text-muted-foreground">{todayWeekday}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("gregorianToHijri.resultLabel")}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {todayHijri.day} {tMonths(String(todayHijri.monthIndex))}{" "}
              {todayHijri.year} {t("today.ahSuffix")}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-tight">
              {t("gregorianToHijri.title")}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetGreg}
            >
              <RotateCcw className="size-3.5" />
              {t("gregorianToHijri.useToday")}
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="block text-xs uppercase tracking-wider text-muted-foreground">
                {t("gregorianToHijri.dateLabel")}
              </span>
              <input
                type="date"
                value={gregInput}
                onChange={(e) => setGregInput(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-base tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          </div>
          <div className="mt-5 rounded-md border border-border bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("gregorianToHijri.resultLabel")}
            </p>
            {gregToHijri ? (
              <>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {gregToHijri.day} {tMonths(String(gregToHijri.monthIndex))}{" "}
                  {gregToHijri.year} {t("today.ahSuffix")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {gregToHijri.weekday}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-danger">
                {t("errors.invalidDate")}
              </p>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-tight">
              {t("hijriToGregorian.title")}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetHijri}
            >
              <RotateCcw className="size-3.5" />
              {t("hijriToGregorian.useToday")}
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="block text-xs uppercase tracking-wider text-muted-foreground">
                {t("hijriToGregorian.yearLabel")}
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={MIN_HY}
                max={MAX_HY}
                value={Number.isFinite(hYear) ? hYear : ""}
                onChange={(e) => setHYear(Number(e.target.value))}
                className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-base tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="block sm:col-span-1">
              <span className="block text-xs uppercase tracking-wider text-muted-foreground">
                {t("hijriToGregorian.monthLabel")}
              </span>
              <select
                value={hMonth}
                onChange={(e) => setHMonth(Number(e.target.value))}
                className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-wider text-muted-foreground">
                {t("hijriToGregorian.dayLabel")}
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={30}
                value={Number.isFinite(hDay) ? hDay : ""}
                onChange={(e) => setHDay(Number(e.target.value))}
                className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-base tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          </div>
          <div className="mt-5 rounded-md border border-border bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("hijriToGregorian.resultLabel")}
            </p>
            {hijriToGreg && "error" in hijriToGreg ? (
              <p className="mt-1 text-sm text-danger">
                {t(`errors.${hijriToGreg.error}`)}
              </p>
            ) : hijriToGreg ? (
              <>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {hijriToGreg.longDate} {t("today.ceSuffix")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {hijriToGreg.weekday}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-danger">
                {t("errors.invalidDate")}
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
