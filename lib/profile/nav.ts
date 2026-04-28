import type { LucideIcon } from "lucide-react";
import {
  BookOpenCheck,
  CalendarDays,
  Heart,
  LayoutDashboard,
  Mail,
  MapPin,
  Star,
} from "lucide-react";

export type ProfileNavKey =
  | "overview"
  | "reading"
  | "favorites"
  | "matrimonial"
  | "events"
  | "submitMosque"
  | "contact";

export interface ProfileNavItem {
  labelKey: ProfileNavKey;
  href: string;
  icon: LucideIcon;
}

export const PROFILE_NAV: ProfileNavItem[] = [
  { labelKey: "overview", href: "/profile", icon: LayoutDashboard },
  { labelKey: "reading", href: "/profile/reading", icon: BookOpenCheck },
  { labelKey: "favorites", href: "/profile/favorites", icon: Star },
  { labelKey: "matrimonial", href: "/matrimonial/settings", icon: Heart },
  { labelKey: "events", href: "/events", icon: CalendarDays },
  { labelKey: "submitMosque", href: "/mosques/submit", icon: MapPin },
  { labelKey: "contact", href: "/contact", icon: Mail },
];
