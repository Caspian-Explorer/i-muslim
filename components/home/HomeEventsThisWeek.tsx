import { getLocale, getTranslations } from "next-intl/server";
import { fetchPublicEvents } from "@/lib/events/public";
import { fetchIpLocation } from "@/lib/prayer/location";
import { haversineKm } from "@/lib/events/geo";
import { HomeSection } from "./HomeSection";
import { HomeEventsRefiner } from "./HomeEventsRefiner";
import type { SerializableEvent } from "./home-event-shapes";
import type { PublicEventListItem } from "@/lib/events/public";

const MAX_EVENTS = 6;

export async function HomeEventsThisWeek() {
  const [t, locale, { events }, ip] = await Promise.all([
    getTranslations("home.eventsThisWeek"),
    getLocale(),
    fetchPublicEvents({ windowDays: 7, limit: 50 }),
    fetchIpLocation().catch(() => null),
  ]);
  if (events.length === 0) return null;

  const ipCoords = ip?.coords ?? null;
  const sorted = ipCoords
    ? [...events].sort((a, b) => {
        const aLat = a.event.location.lat;
        const aLng = a.event.location.lng;
        const bLat = b.event.location.lat;
        const bLng = b.event.location.lng;
        const aHas = typeof aLat === "number" && typeof aLng === "number";
        const bHas = typeof bLat === "number" && typeof bLng === "number";
        if (aHas && bHas) {
          return (
            haversineKm(ipCoords, { lat: aLat!, lng: aLng! }) -
            haversineKm(ipCoords, { lat: bLat!, lng: bLng! })
          );
        }
        if (aHas) return -1;
        if (bHas) return 1;
        return 0;
      })
    : events;

  const initial = sorted.slice(0, MAX_EVENTS);
  const heading = ip?.city
    ? t("headingNear", { city: ip.city })
    : t("headingGlobal");

  return (
    <HomeSection
      heading={heading}
      subheading={t("subheading")}
      viewAllHref="/events"
      viewAllLabel={t("viewAll")}
    >
      <HomeEventsRefiner
        items={serialize(initial)}
        all={serialize(events)}
        max={MAX_EVENTS}
        locale={locale}
        translations={{
          dateNotice: t("subheading"),
          kmAway: t("kmAway"),
          venueOnline: t("venueOnline"),
        }}
      />
    </HomeSection>
  );
}

function serialize(items: PublicEventListItem[]): SerializableEvent[] {
  return items.map(({ event, nextStartsAt }) => ({
    id: event.id,
    title: event.title,
    nextStartsAt,
    venue: event.location.venue ?? null,
    address: event.location.address ?? null,
    mode: event.location.mode,
    lat: event.location.lat ?? null,
    lng: event.location.lng ?? null,
  }));
}
