import { Settings, Image as ImageIcon, Languages } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SettingsNavItem {
  id: string;
  href: string;
  labelKey: "general" | "media" | "languages";
  icon: LucideIcon;
}

export const SETTINGS_NAV: SettingsNavItem[] = [
  { id: "general", href: "/admin/settings", labelKey: "general", icon: Settings },
  { id: "media", href: "/admin/settings/media", labelKey: "media", icon: ImageIcon },
  { id: "languages", href: "/admin/settings/languages", labelKey: "languages", icon: Languages },
];
