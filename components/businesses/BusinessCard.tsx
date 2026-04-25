import Link from "next/link";
import { useLocale } from "next-intl";
import { MapPin } from "lucide-react";
import { HalalBadge } from "./HalalBadge";
import { HoursDisplay } from "./HoursDisplay";
import type {
  Business,
  BusinessCategory,
  BusinessCertificationBody,
} from "@/types/business";
import type { Locale } from "@/i18n/config";

interface Props {
  business: Business;
  categories: BusinessCategory[];
  certBodies: BusinessCertificationBody[];
}

function bucketUrl(storagePath: string): string {
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucket) return "";
  return `https://storage.googleapis.com/${bucket}/${encodeURI(storagePath)}`;
}

export function BusinessCard({ business, categories, certBodies }: Props) {
  const locale = useLocale() as Locale;
  const certBody = business.halal.certificationBodyId
    ? certBodies.find((b) => b.id === business.halal.certificationBodyId) ?? null
    : null;
  const primaryCat = business.categoryIds[0]
    ? categories.find((c) => c.id === business.categoryIds[0]) ?? null
    : null;
  const photo = business.photos[0];
  const photoUrl = photo ? bucketUrl(photo.storagePath) : "";
  const description = business.description[locale] ?? business.description.en;

  return (
    <Link
      href={`/businesses/${business.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-background transition-colors hover:border-accent"
    >
      <div className="aspect-[5/3] w-full bg-muted">
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={photo?.alt ?? business.name}
            className="size-full object-cover"
            loading="lazy"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground group-hover:underline">{business.name}</h3>
          <HoursDisplay hours={business.hours} variant="compact" />
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3" /> {business.address.city}
          {primaryCat && (
            <>
              <span aria-hidden>·</span>
              <span>{primaryCat.name[locale] ?? primaryCat.name.en}</span>
            </>
          )}
          {business.priceTier && (
            <>
              <span aria-hidden>·</span>
              <span>{"$".repeat(business.priceTier)}</span>
            </>
          )}
        </div>
        <p className="line-clamp-2 text-sm text-foreground/80">{description}</p>
        <HalalBadge business={business} certBody={certBody} size="sm" className="mt-auto" />
      </div>
    </Link>
  );
}
