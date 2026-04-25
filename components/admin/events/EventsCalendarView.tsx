"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { expandEventOccurrences } from "@/lib/admin/recurrence";
import { getHijriParts } from "@/lib/admin/hijri";
import type { AdminEvent, EventCategory } from "@/types/admin";

interface Props {
  events: AdminEvent[];
  onEdit: (event: AdminEvent) => void;
}

interface DayCell {
  date: Date;
  inMonth: boolean;
  occurrences: Array<{ event: AdminEvent; startsAt: Date }>;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function categoryDot(category: EventCategory): string {
  switch (category) {
    case "prayer":
      return "bg-sidebar-accent";
    case "lecture":
    case "class":
      return "bg-[color:var(--chart-2)]";
    case "iftar":
    case "community":
      return "bg-success";
    case "fundraiser":
      return "bg-warning";
    case "janazah":
      return "bg-danger";
    default:
      return "bg-muted-foreground";
  }
}

export function EventsCalendarView({ events, onEdit }: Props) {
  const [cursor, setCursor] = useState<Date>(() => startOfMonth(new Date()));
  const t = useTranslations("events");
  const tCalendar = useTranslations("events.calendar");
  const locale = useLocale();

  const grid = useMemo<DayCell[]>(() => {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const gridStart = new Date(monthStart);
    gridStart.setDate(monthStart.getDate() - monthStart.getDay());
    const gridEnd = new Date(monthEnd);
    gridEnd.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()));

    const cells: DayCell[] = [];
    const cursorDay = new Date(gridStart);
    while (cursorDay <= gridEnd) {
      cells.push({
        date: new Date(cursorDay),
        inMonth: cursorDay.getMonth() === monthStart.getMonth(),
        occurrences: [],
      });
      cursorDay.setDate(cursorDay.getDate() + 1);
    }

    const windowStart = new Date(gridStart);
    const windowEnd = new Date(gridEnd);
    windowEnd.setHours(23, 59, 59, 999);

    for (const event of events) {
      if (event.status === "cancelled") continue;
      const occs = expandEventOccurrences(event, windowStart, windowEnd, 100);
      for (const occ of occs) {
        const cell = cells.find(
          (c) => startOfDay(c.date).getTime() === startOfDay(occ.startsAt).getTime(),
        );
        if (cell) cell.occurrences.push({ event, startsAt: occ.startsAt });
      }
    }
    return cells;
  }, [events, cursor]);

  const monthLabel = cursor.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });

  const weekdays = useMemo(() => {
    const base = new Date(2024, 0, 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d.toLocaleDateString(locale, { weekday: "short" });
    });
  }, [locale]);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border p-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
          aria-label={tCalendar("prevMonth")}
        >
          <ChevronLeft className="size-4 rtl:rotate-180" />
        </Button>
        <div className="text-sm font-semibold text-foreground">{monthLabel}</div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCursor(startOfMonth(new Date()))}
          >
            {tCalendar("today")}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            aria-label={tCalendar("nextMonth")}
          >
            <ChevronRight className="size-4 rtl:rotate-180" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs uppercase tracking-wide text-muted-foreground">
        {weekdays.map((wd) => (
          <div key={wd} className="px-2 py-2 font-medium">{wd}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {grid.map((cell, i) => {
          const isToday =
            startOfDay(cell.date).getTime() === startOfDay(new Date()).getTime();
          const hijri = getHijriParts(cell.date);
          return (
            <div
              key={i}
              className={cn(
                "min-h-[5.5rem] border-b border-e border-border p-1.5 text-xs",
                !cell.inMonth && "bg-muted/20 text-muted-foreground/60",
                (i + 1) % 7 === 0 && "border-e-0",
              )}
            >
              <div className="flex items-baseline justify-between">
                <span
                  className={cn(
                    "tabular-nums",
                    isToday && "rounded bg-primary px-1.5 text-primary-foreground",
                  )}
                >
                  {cell.date.getDate()}
                </span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {hijri.day}
                </span>
              </div>
              <ul className="mt-1 space-y-0.5">
                {cell.occurrences.slice(0, 3).map((occ, idx) => (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => onEdit(occ.event)}
                      className="flex w-full items-center gap-1 truncate rounded-sm px-1 py-0.5 text-start hover:bg-muted"
                      title={`${occ.event.title.en} · ${occ.startsAt.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}`}
                    >
                      <span
                        className={cn("inline-block size-1.5 rounded-full shrink-0", categoryDot(occ.event.category))}
                      />
                      <span className="truncate text-foreground">{occ.event.title.en}</span>
                    </button>
                  </li>
                ))}
                {cell.occurrences.length > 3 && (
                  <li className="px-1 text-[10px] text-muted-foreground">
                    {t("calendar.more", { count: cell.occurrences.length - 3 })}
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
