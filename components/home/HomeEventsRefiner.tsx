"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Globe, MapPin } from "lucide-react";
import { haversineKm } from "@/lib/events/geo";
import {
  geolocationPermissionState,
  requestBrowserLocation,
} from "@/lib/prayer/location";
import type { SerializableEvent } from "./home-event-shapes";

interface Props {
  items: SerializableEvent[];
  all: SerializableEvent[];
  max: number;
  locale: string;
  translations: {
    dateNotice: string;
    kmAway: string;
    venueOnline: string;
  };
}

export function HomeEventsRefiner({
  items,
  all,
  max,
  locale,
  translations,
}: Props) {
  const [browserCoords, setBrowserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const state = await geolocationPermissionState();
      if (state !== "granted") return;
      try {
        const pos = await requestBrowserLocation({ enableHighAccuracy: false });
        if (cancelled) return;
        setBrowserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const display = useMemo(() => {
    if (!browserCoords) return items;
    const sorted = [...all].sort((a, b) => {
      const aHas = typeof a.lat === "number" && typeof a.lng === "number";
      const bHas = typeof b.lat === "number" && typeof b.lng === "number";
      if (aHas && bHas) {
        return (
          haversineKm(browserCoords, { lat: a.lat!, lng: a.lng! }) -
          haversineKm(browserCoords, { lat: b.lat!, lng: b.lng! })
        );
      }
      if (aHas) return -1;
      if (bHas) return 1;
      return 0;
    });
    return sorted.slice(0, max);
  }, [all, items, browserCoords, max]);

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {display.map((e) => {
        const start = new Date(e.nextStartsAt);
        const distance =
          browserCoords && typeof e.lat === "number" && typeof e.lng === "number"
            ? haversineKm(browserCoords, { lat: e.lat, lng: e.lng })
            : null;
        const where =
          e.venue ?? e.address ?? (e.mode !== "in-person" ? translations.venueOnline : null);
        return (
          <li key={e.id}>
            <Link
              href={`/events/${e.id}`}
              className="flex h-full flex-col rounded-xl border border-border bg-background p-5 transition-colors hover:border-accent"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
                <CalendarDays className="size-3.5" />
                <span>
                  {start.toLocaleDateString(locale, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                  {" · "}
                  {start.toLocaleTimeString(locale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <h3 className="mt-2 line-clamp-2 text-base font-semibold text-foreground">
                {e.title}
              </h3>
              {where && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground line-clamp-1">
                  {e.mode === "in-person" ? (
                    <MapPin className="size-3" />
                  ) : (
                    <Globe className="size-3" />
                  )}
                  <span>{where}</span>
                </p>
              )}
              {distance !== null && (
                <p className="mt-auto pt-2 text-xs text-accent">
                  {translations.kmAway.replace("{km}", distance.toFixed(1))}
                </p>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
