import type { LucideIcon } from "lucide-react";
import { BookOpenCheck, Heart, LayoutDashboard, Star } from "lucide-react";

export type ProfileNavKey = "overview" | "reading" | "favorites" | "matrimonial";

export interface ProfileNavItem {
  labelKey: ProfileNavKey;
  href: string;
  icon: LucideIcon;
}

export const PROFILE_NAV: ProfileNavItem[] = [
  { labelKey: "overview", href: "/profile", icon: LayoutDashboard },
  { labelKey: "reading", href: "/profile/reading", icon: BookOpenCheck },
  { labelKey: "favorites", href: "/profile/favorites", icon: Star },
  { labelKey: "matrimonial", href: "/profile/matrimonial", icon: Heart },
];
