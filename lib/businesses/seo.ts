import type { Business, BusinessHoursDay, BusinessHours } from "@/types/business";

const DAY_TO_SCHEMA: Record<BusinessHoursDay, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

function openingHoursSpecification(hours: BusinessHours) {
  const out: Array<Record<string, string>> = [];
  for (const day of Object.keys(DAY_TO_SCHEMA) as BusinessHoursDay[]) {
    const entry = hours[day];
    if (!entry) continue;
    out.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DAY_TO_SCHEMA[day],
      opens: entry.open,
      closes: entry.close,
    });
  }
  return out;
}

export function buildLocalBusinessJsonLd(business: Business, baseUrl: string) {
  const url = `${baseUrl.replace(/\/$/, "")}/businesses/${business.slug}`;
  const photos = business.photos.map((p) => p.storagePath);
  const json = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": url,
    name: business.name,
    description: business.description.en,
    url,
    image: photos.length > 0 ? photos : undefined,
    telephone: business.contact.phone,
    email: business.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address.line1,
      addressLocality: business.address.city,
      addressRegion: business.address.region,
      postalCode: business.address.postalCode,
      addressCountry: business.address.countryCode,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: business.address.lat,
      longitude: business.address.lng,
    },
    openingHoursSpecification: openingHoursSpecification(business.hours),
    priceRange: business.priceTier ? "$".repeat(business.priceTier) : undefined,
    sameAs: [business.contact.website, business.contact.instagram].filter(Boolean),
  };

  // Strip undefined for cleaner JSON
  return JSON.parse(JSON.stringify(json));
}

export function isCertificationActive(business: Business, now: Date = new Date()): boolean {
  if (business.halal.status !== "certified") return false;
  if (!business.halal.expiresAt) return true;
  return new Date(business.halal.expiresAt).getTime() >= now.getTime();
}
