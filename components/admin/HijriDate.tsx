"use client";

import { useSyncExternalStore } from "react";
import { formatHijri, formatGregorian } from "@/lib/admin/hijri";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function useTodayDates(): { hijri: string; gregorian: string } | null {
  return useSyncExternalStore(
    () => () => {},
    () => {
      const now = new Date();
      return { hijri: formatHijri(now), gregorian: formatGregorian(now) };
    },
    () => null,
  );
}

export function HijriDate() {
  const today = useTodayDates();

  if (!today) return <span className="text-sm text-muted-foreground">—</span>;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help text-sm text-muted-foreground" aria-label={`${today.hijri} (${today.gregorian})`}>
            {today.hijri}
          </span>
        </TooltipTrigger>
        <TooltipContent>{today.gregorian}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
