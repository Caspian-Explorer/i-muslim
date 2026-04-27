"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  CalendarDays,
  Clock,
  Globe,
  MapPin,
  Navigation,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getHijriParts } from "@/lib/admin/hijri";
import { haversineKm } from "@/lib/events/geo";
import type {
  AdminEvent,
  EventCategory,
} from "@/types/admin";
import type { PublicEventListItem } from "@/lib/events/public";

const CATEGORIES: Array<EventCategory | "all"> = [
  "all",
  "prayer",
  "lecture",
  "iftar",
  "janazah",
  "class",
  "fundraiser",
  "community",
  "other",
];

function categoryVariant(category: EventCategory): "accent" | "info" | "success" | "warning" | "danger" | "neutral" {
  switch (category) {
    case "prayer":
      return "accent";
    case "lecture":
    case "class":
      return "info";
    case "iftar":
    case "community":
      return "success";
    case "fundraiser":
      return "warning";
    case "janazah":
      return "danger";
    default:
      return "neutral";
  }
}

export function PublicEventsList({ items }: { items: PublicEventListItem[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<EventCategory | "all">("all");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "requesting" | "denied" | "unsupported">("idle");
  const t = useTranslations("eventsPublic");
  const tCategories = useTranslations("events.categories");
  const tHijriMonths = useTranslations("hijri.months");
  const locale = useLocale();

  function requestLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoState("unsupported");
      return;
    }
    setGeoState("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState("idle");
      },
      () => {
        setGeoState("denied");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }

  const enriched = useMemo(() => {
    return items
      .map(({ event, nextStartsAt }) => {
        const distanceKm =
          coords && event.location.lat != null && event.location.lng != null
            ? haversineKm(coords, { lat: event.location.lat, lng: event.location.lng })
            : null;
        return { event, nextStartsAt, distanceKm };
      })
      .filter(({ event }) => {
        if (category !== "all" && event.category !== category) return false;
        if (query) {
          const q = query.toLowerCase();
          const haystack = [
            event.title,
            event.description ?? "",
            event.organizer?.name ?? "",
            event.location.venue ?? "",
            event.location.address ?? "",
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (coords && a.distanceKm != null && b.distanceKm != null) {
          return a.distanceKm - b.distanceKm;
        }
        return new Date(a.nextStartsAt).getTime() - new Date(b.nextStartsAt).getTime();
      });
  }, [items, query, category, coords]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="ps-8 w-full"
            aria-label={t("searchAria")}
          />
        </div>
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value as EventCategory | "all")}
          aria-label={t("filterByCategory")}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{tCategories(c)}</option>
          ))}
        </select>
        <Button
          variant={coords ? "secondary" : "ghost"}
          size="sm"
          onClick={requestLocation}
          disabled={geoState === "requesting"}
        >
          <Navigation className="me-1 size-3.5" />
          {coords ? t("nearMeOn") : geoState === "requesting" ? t("locating") : t("nearMe")}
        </Button>
      </div>

      {geoState === "denied" && (
        <p className="text-sm text-warning">{t("locationDenied")}</p>
      )}
      {geoState === "unsupported" && (
        <p className="text-sm text-warning">{t("locationUnsupported")}</p>
      )}

      {enriched.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/30 p-10 text-center">
          <CalendarDays className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">{t("noResults")}</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {enriched.map(({ event, nextStartsAt, distanceKm }) => (
            <li key={event.id}>
              <EventCard
                event={event}
                nextStartsAt={nextStartsAt}
                distanceKm={distanceKm}
                locale={locale}
                hijriMonth={(idx) => tHijriMonths(String(idx))}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EventCard({
  event,
  nextStartsAt,
  distanceKm,
  locale,
  hijriMonth,
}: {
  event: AdminEvent;
  nextStartsAt: string;
  distanceKm: number | null;
  locale: string;
  hijriMonth: (idx: number) => string;
}) {
  const t = useTranslations("eventsPublic");
  const tCategories = useTranslations("events.categories");
  const start = new Date(nextStartsAt);
  const hijri = getHijriParts(start);
  const dateStr = start.toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeStr = start.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const Icon = event.location.mode === "online" ? Globe : MapPin;
  const where =
    event.location.venue ?? event.location.address ?? event.location.url ?? "—";

  return (
    <Link
      href={`/events/${event.id}`}
      className={cn(
        "block h-full rounded-xl border border-border bg-background p-5 transition-colors hover:border-accent",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground truncate">{event.title}</h2>
        </div>
        <Badge variant={categoryVariant(event.category)}>
          {tCategories(event.category)}
        </Badge>
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="size-4 shrink-0" />
          <span className="tabular-nums">
            {dateStr} · {timeStr}
          </span>
          <span className="text-xs">
            ({hijri.day} {hijriMonth(hijri.monthIndex)} {hijri.year})
          </span>
        </div>
        {event.startAnchor && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3.5 shrink-0" />
            <span>{t("anchorNote", { prayer: event.startAnchor.prayer })}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="size-4 shrink-0" />
          <span className="truncate">{where}</span>
          {distanceKm != null && (
            <span className="ms-auto shrink-0 text-xs tabular-nums">
              {t("kmAway", { km: distanceKm.toFixed(1) })}
            </span>
          )}
        </div>
      </dl>
    </Link>
  );
}

