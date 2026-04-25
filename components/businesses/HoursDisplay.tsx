"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BUSINESS_HOURS_DAYS, type BusinessHours, type BusinessHoursDay } from "@/types/business";

const DAY_INDEX_TO_KEY: BusinessHoursDay[] = [
  "sun", "mon", "tue", "wed", "thu", "fri", "sat",
];

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

interface Props {
  hours: BusinessHours;
  variant?: "full" | "compact";
}

export function HoursDisplay({ hours, variant = "full" }: Props) {
  const t = useTranslations("businesses");
  const tDays = useTranslations("businesses.weekdays");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const isOpen = (() => {
    if (!now) return null;
    const dayKey = DAY_INDEX_TO_KEY[now.getDay()]!;
    const entry = hours[dayKey];
    if (!entry) return false;
    const minutes = now.getHours() * 60 + now.getMinutes();
    return minutes >= toMinutes(entry.open) && minutes < toMinutes(entry.close);
  })();

  if (variant === "compact") {
    return (
      <Badge variant={isOpen ? "success" : "neutral"} className="gap-1.5">
        <Clock className="size-3" />
        {isOpen === null ? "—" : isOpen ? t("card.open") : t("card.closed")}
      </Badge>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Clock className="size-4 text-muted-foreground" />
        {isOpen !== null && (
          <Badge variant={isOpen ? "success" : "neutral"}>
            {isOpen ? t("card.open") : t("card.closed")}
          </Badge>
        )}
      </div>
      <ul className="grid gap-0.5 text-sm">
        {BUSINESS_HOURS_DAYS.map((d) => {
          const entry = hours[d];
          const todayKey = now ? DAY_INDEX_TO_KEY[now.getDay()] : null;
          const isToday = todayKey === d;
          return (
            <li
              key={d}
              className={
                "flex items-center justify-between gap-3 rounded px-2 py-1 " +
                (isToday ? "bg-muted/60 font-medium" : "")
              }
            >
              <span className="text-muted-foreground">{tDays(d)}</span>
              <span>
                {entry ? `${entry.open} – ${entry.close}` : <span className="text-muted-foreground">{t("card.closed")}</span>}
              </span>
            </li>
          );
        })}
      </ul>
      {hours.notes && <p className="pt-1 text-xs text-muted-foreground">{hours.notes}</p>}
    </div>
  );
}
