"use client";

import { useSyncExternalStore } from "react";
import { Clock } from "lucide-react";

function useNow(intervalMs: number): Date | null {
  const ts = useSyncExternalStore(
    (cb) => {
      const id = setInterval(cb, intervalMs);
      return () => clearInterval(id);
    },
    () => Date.now(),
    () => 0,
  );
  return ts === 0 ? null : new Date(ts);
}

type Prayer = { name: string; time: string };

// Placeholder times for display only. The public site's CLAUDE.md warns that
// prayer-time computation differs by region and method; real calculation is
// deferred to a later phase when a user-selected method and coords are wired.
const PRAYERS: Prayer[] = [
  { name: "Fajr", time: "04:52" },
  { name: "Dhuhr", time: "12:38" },
  { name: "Asr", time: "16:18" },
  { name: "Maghrib", time: "19:42" },
  { name: "Isha", time: "21:12" },
];

function parseHm(hm: string): { h: number; m: number } {
  const [h = "0", m = "0"] = hm.split(":");
  return { h: Number(h), m: Number(m) };
}

function minutesUntil(hm: string, now: Date): number {
  const { h, m } = parseHm(hm);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  const delta = target.getTime() - now.getTime();
  return Math.round(delta / 60000);
}

export function PrayerTimesWidget() {
  const now = useNow(30_000);

  if (!now) {
    return <div className="text-sm text-muted-foreground">—</div>;
  }

  const nextIdx = PRAYERS.findIndex((p) => minutesUntil(p.time, now) > 0);
  const current = nextIdx === -1 ? PRAYERS.length - 1 : Math.max(0, nextIdx - 1);
  const next = nextIdx === -1 ? null : PRAYERS[nextIdx]!;
  const countdown = next
    ? (() => {
        const mins = minutesUntil(next.time, now);
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
      })()
    : "—";

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
      <Clock className="size-4 text-muted-foreground shrink-0" />
      {next ? (
        <span className="text-sm">
          <span className="text-muted-foreground">Next:</span>{" "}
          <span className="font-medium text-foreground">{next.name}</span>{" "}
          <span className="font-mono tabular-nums text-muted-foreground">
            {next.time} · in {countdown}
          </span>
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">All prayers complete</span>
      )}
      <div className="ml-auto hidden gap-2 md:flex">
        {PRAYERS.map((p, i) => (
          <div
            key={p.name}
            className={
              "flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs tabular-nums " +
              (i === current
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground")
            }
          >
            <span>{p.name}</span>
            <span className="font-mono">{p.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
