import type { BundledLocale } from "@/i18n/config";

export type BusinessStatus = "draft" | "published" | "archived";

export type HalalStatus = "certified" | "self_declared" | "muslim_owned" | "unverified";

export type PriceTier = 1 | 2 | 3 | 4;

// Authored content (categories, amenities, business names) is translated only
// for the bundled UI locales. Reserved/un-activated locales render with the
// English value as a fallback at the call site.
export type LocalizedTextRequired = Record<BundledLocale, string>;

export interface PartialLocalizedText {
  en: string;
  ar?: string;
  tr?: string;
  id?: string;
}

export interface BusinessAddress {
  line1: string;
  city: string;
  region?: string;
  countryCode: string;
  postalCode?: string;
  lat: number;
  lng: number;
}

export interface BusinessHoursEntry {
  open: string;
  close: string;
}

export interface BusinessHours {
  mon: BusinessHoursEntry | null;
  tue: BusinessHoursEntry | null;
  wed: BusinessHoursEntry | null;
  thu: BusinessHoursEntry | null;
  fri: BusinessHoursEntry | null;
  sat: BusinessHoursEntry | null;
  sun: BusinessHoursEntry | null;
  notes?: string;
}

export type BusinessHoursDay = keyof Omit<BusinessHours, "notes">;

export const BUSINESS_HOURS_DAYS: BusinessHoursDay[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export interface BusinessContact {
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  whatsapp?: string;
}

export interface BusinessHalal {
  status: HalalStatus;
  certificationBodyId?: string;
  certificationNumber?: string;
  expiresAt?: string;
}

export interface BusinessPhoto {
  storagePath: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface Business {
  id: string;
  slug: string;
  status: BusinessStatus;
  source: "admin" | "owner-claim";
  name: string;
  description: PartialLocalizedText;
  categoryIds: string[];
  halal: BusinessHalal;
  muslimOwned: boolean;
  platformVerifiedAt?: string;
  contact: BusinessContact;
  address: BusinessAddress;
  hours: BusinessHours;
  amenityIds: string[];
  priceTier?: PriceTier;
  photos: BusinessPhoto[];
  ownerEmail?: string;
  searchTokens: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface BusinessCategory {
  id: string;
  slug: string;
  name: LocalizedTextRequired;
  iconKey?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface BusinessCertificationBody {
  id: string;
  slug: string;
  name: string;
  country: string;
  website?: string;
  logoStoragePath?: string;
  verifiedByPlatform: boolean;
}

export interface BusinessAmenity {
  id: string;
  slug: string;
  name: LocalizedTextRequired;
  iconKey?: string;
}

export type BusinessReportReason =
  | "not_halal"
  | "closed"
  | "wrong_info"
  | "offensive"
  | "duplicate"
  | "other";

export type BusinessReportStatus = "open" | "resolved" | "dismissed";

export interface BusinessReport {
  id: string;
  businessId: string;
  businessSlug: string;
  businessName: string;
  reason: BusinessReportReason;
  note?: string;
  reporterEmail?: string;
  reporterIp?: string;
  status: BusinessReportStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface BusinessFilters {
  q?: string;
  city?: string;
  categoryId?: string;
  halal?: HalalStatus;
  amenityId?: string;
  priceTier?: PriceTier;
}
