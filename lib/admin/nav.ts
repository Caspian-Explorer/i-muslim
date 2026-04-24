import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  BookMarked,
  BookOpen,
  BookOpenCheck,
  Calendar,
  CalendarDays,
  Clock,
  FileBarChart,
  FileText,
  GraduationCap,
  HandCoins,
  Heart,
  Image,
  Landmark,
  LayoutDashboard,
  Mail,
  Megaphone,
  MessageCircleQuestion,
  MessageSquareWarning,
  Mic2,
  Plug,
  ScrollText,
  Settings,
  Shield,
  Sparkles,
  Store,
  Users,
  Users2,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: "pendingUsers" | "unansweredQa" | "flaggedContent";
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const ADMIN_NAV: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { label: "Activity Log", href: "/admin/activity", icon: Activity },
    ],
  },
  {
    id: "community",
    label: "Community",
    items: [
      { label: "Users", href: "/admin/users", icon: Users, badgeKey: "pendingUsers" },
      { label: "Roles & Permissions", href: "/admin/roles", icon: Shield },
      { label: "Scholars & Imams", href: "/admin/scholars", icon: GraduationCap },
      { label: "Groups & Chapters", href: "/admin/groups", icon: Users2 },
    ],
  },
  {
    id: "content",
    label: "Content",
    items: [
      { label: "Articles & Blog", href: "/admin/articles", icon: FileText },
      { label: "Quran Resources", href: "/admin/quran", icon: BookOpen },
      { label: "Hadith Collections", href: "/admin/hadith", icon: BookMarked },
      { label: "Duas & Adhkar", href: "/admin/duas", icon: Sparkles },
      { label: "Khutbahs / Sermons", href: "/admin/khutbahs", icon: Mic2 },
      { label: "Media Library", href: "/admin/media", icon: Image },
    ],
  },
  {
    id: "worship",
    label: "Worship & Calendar",
    items: [
      { label: "Prayer Times", href: "/admin/prayer-times", icon: Clock },
      { label: "Hijri Calendar", href: "/admin/hijri-calendar", icon: Calendar },
      { label: "Events", href: "/admin/events", icon: CalendarDays },
      { label: "Mosque Directory", href: "/admin/mosques", icon: Landmark },
    ],
  },
  {
    id: "engagement",
    label: "Engagement",
    items: [
      {
        label: "Q&A / Fatwa Requests",
        href: "/admin/qa",
        icon: MessageCircleQuestion,
        badgeKey: "unansweredQa",
      },
      { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
      { label: "Newsletter", href: "/admin/newsletter", icon: Mail },
      {
        label: "Comments & Moderation",
        href: "/admin/moderation",
        icon: MessageSquareWarning,
        badgeKey: "flaggedContent",
      },
    ],
  },
  {
    id: "services",
    label: "Services",
    items: [
      { label: "Donations & Zakat", href: "/admin/donations", icon: HandCoins },
      { label: "Halal Business Directory", href: "/admin/businesses", icon: Store },
      { label: "Classes & Courses", href: "/admin/courses", icon: BookOpenCheck },
      { label: "Matrimonial", href: "/admin/matrimonial", icon: Heart },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { label: "Reports", href: "/admin/reports", icon: FileBarChart },
      { label: "Audit Logs", href: "/admin/audit", icon: ScrollText },
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { label: "Integrations", href: "/admin/integrations", icon: Plug },
    ],
  },
];

export function flattenNav(): NavItem[] {
  return ADMIN_NAV.flatMap((g) => g.items);
}

export function findNavItem(pathname: string): NavItem | null {
  const items = flattenNav();
  const exact = items.find((i) => i.href === pathname);
  if (exact) return exact;
  return (
    items
      .filter((i) => i.href !== "/admin" && pathname.startsWith(i.href))
      .sort((a, b) => b.href.length - a.href.length)[0] ?? null
  );
}
