import type { LucideIcon } from "lucide-react";
import {
  BookOpenCheck,
  ClipboardList,
  Heart,
  LayoutDashboard,
  MessageCircle,
  Star,
  StickyNote,
} from "lucide-react";

export type ProfileNavKey =
  | "overview"
  | "reading"
  | "favorites"
  | "notes"
  | "comments"
  | "matrimonial"
  | "submissions";

export interface ProfileNavItem {
  labelKey: ProfileNavKey;
  href: string;
  icon: LucideIcon;
}

export const PROFILE_NAV: ProfileNavItem[] = [
  { labelKey: "overview", href: "/profile", icon: LayoutDashboard },
  { labelKey: "reading", href: "/profile/reading", icon: BookOpenCheck },
  { labelKey: "favorites", href: "/profile/favorites", icon: Star },
  { labelKey: "notes", href: "/profile/notes", icon: StickyNote },
  { labelKey: "comments", href: "/profile/comments", icon: MessageCircle },
  { labelKey: "submissions", href: "/profile/submissions", icon: ClipboardList },
  { labelKey: "matrimonial", href: "/profile/matrimonial", icon: Heart },
];
