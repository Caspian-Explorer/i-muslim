import { RRule, rrulestr } from "rrule";
import umalqura from "@umalqura/core";
import type { AdminEvent } from "@/types/admin";

export interface RecurrencePreset {
  id: "weekly-friday" | "weekly" | "daily" | "monthly" | "custom";
  rrule: string;
}

export function buildRRule(
  freq: "weekly" | "daily" | "monthly",
  startsAt: Date,
  count?: number,
): string {
  const rule = new RRule({
    freq:
      freq === "weekly"
        ? RRule.WEEKLY
        : freq === "daily"
          ? RRule.DAILY
          : RRule.MONTHLY,
    dtstart: startsAt,
    count,
  });
  return rule.toString();
}

export function describeRRule(rrule: string): string {
  try {
    const rule = rrulestr(rrule);
    return rule.toText();
  } catch {
    return rrule;
  }
}

export function expandOccurrences(
  rrule: string,
  startsAt: Date,
  from: Date,
  to: Date,
  cap = 50,
): Date[] {
  try {
    const rule = rrulestr(rrule, { dtstart: startsAt });
    return rule.between(from, to, true).slice(0, cap);
  } catch {
    return [];
  }
}

const HIJRI_MIN = umalqura.min.date.getTime();
const HIJRI_MAX = umalqura.max.date.getTime();

export function gregorianForHijri(
  hijriMonth: number,
  hijriDay: number,
  hourLocal: number,
  minuteLocal: number,
  hijriYear: number,
): Date {
  const m = Math.min(12, Math.max(1, hijriMonth));
  const d = Math.min(30, Math.max(1, hijriDay));
  const g = umalqura(hijriYear, m, d).date;
  return new Date(
    g.getFullYear(),
    g.getMonth(),
    g.getDate(),
    hourLocal,
    minuteLocal,
    0,
    0,
  );
}

export function expandHijriAnchorOccurrences(
  monthIndex: number,
  day: number,
  hourLocal: number,
  minuteLocal: number,
  from: Date,
  to: Date,
): Date[] {
  const out: Date[] = [];
  const fromHijri = umalqura(
    new Date(Math.max(from.getTime(), HIJRI_MIN)),
  );
  const toHijri = umalqura(new Date(Math.min(to.getTime(), HIJRI_MAX)));
  for (let y = fromHijri.hy; y <= toHijri.hy; y++) {
    try {
      const candidate = gregorianForHijri(monthIndex, day, hourLocal, minuteLocal, y);
      if (candidate.getTime() >= from.getTime() && candidate.getTime() <= to.getTime()) {
        out.push(candidate);
      }
    } catch {
      // skip invalid Hijri date for this year
    }
  }
  return out;
}

export interface ExpandedOccurrence {
  event: AdminEvent;
  startsAt: Date;
  endsAt?: Date;
}

export function expandEventOccurrences(
  event: AdminEvent,
  from: Date,
  to: Date,
  cap = 50,
): ExpandedOccurrence[] {
  const startsAt = new Date(event.startsAt);
  const endsAt = event.endsAt ? new Date(event.endsAt) : undefined;
  const durationMs = endsAt ? endsAt.getTime() - startsAt.getTime() : undefined;

  let dates: Date[] = [];

  if (event.hijriAnchor) {
    dates = expandHijriAnchorOccurrences(
      event.hijriAnchor.monthIndex,
      event.hijriAnchor.day,
      event.hijriAnchor.hourLocal,
      event.hijriAnchor.minuteLocal,
      from,
      to,
    );
  } else if (event.recurrence) {
    dates = expandOccurrences(event.recurrence, startsAt, from, to, cap);
  } else if (
    startsAt.getTime() >= from.getTime() &&
    startsAt.getTime() <= to.getTime()
  ) {
    dates = [startsAt];
  }

  return dates.slice(0, cap).map((d) => ({
    event,
    startsAt: d,
    endsAt: durationMs != null ? new Date(d.getTime() + durationMs) : undefined,
  }));
}

export function nextOccurrenceAfter(
  event: AdminEvent,
  reference: Date,
  horizonDays = 365,
): Date | null {
  const horizon = new Date(reference.getTime() + horizonDays * 24 * 60 * 60 * 1000);
  const occs = expandEventOccurrences(event, reference, horizon, 1);
  return occs.length > 0 ? occs[0]!.startsAt : null;
}

export const PRAYER_ANCHOR_ORDER = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
] as const;
