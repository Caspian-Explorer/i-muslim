"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const TAB_LIST_CLASS =
  "inline-flex h-9 items-center justify-center gap-1 rounded-md bg-muted p-1 text-muted-foreground";

const TAB_TRIGGER_CLASS = cn(
  "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "data-[state=active]:bg-selected data-[state=active]:text-selected-foreground data-[state=active]:shadow-sm",
);

const ROOT_HREF = "/admin/businesses";

const TABS = [
  { href: ROOT_HREF, key: "tabDirectory" },
  { href: "/admin/businesses/submissions", key: "tabSubmissions" },
  { href: "/admin/businesses/reports", key: "tabReports" },
  { href: "/admin/businesses/categories", key: "tabCategories" },
  { href: "/admin/businesses/cert-bodies", key: "tabCertBodies" },
  { href: "/admin/businesses/amenities", key: "tabAmenities" },
] as const;

export function BusinessesTabsNav() {
  const t = useTranslations("businesses.admin");
  const pathname = usePathname();

  return (
    <nav className={TAB_LIST_CLASS} aria-label={t("tabDirectory")}>
      {TABS.map(({ href, key }) => {
        const isActive = href === ROOT_HREF ? pathname === ROOT_HREF : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            data-state={isActive ? "active" : "inactive"}
            className={TAB_TRIGGER_CLASS}
          >
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
