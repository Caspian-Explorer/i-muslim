"use client";

import { useCallback, useSyncExternalStore } from "react";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { PROFILE_NAV } from "@/lib/profile/nav";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "profile:sidebar-collapsed";
const COLLAPSE_EVENT = "profile:sidebar-collapsed-change";

function subscribeCollapse(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(COLLAPSE_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(COLLAPSE_EVENT, cb);
  };
}

function getCollapse(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

function useCollapse(enabled: boolean): [boolean, (next: boolean) => void] {
  const value = useSyncExternalStore(subscribeCollapse, getCollapse, () => false);
  const setValue = useCallback((next: boolean) => {
    try {
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      window.dispatchEvent(new Event(COLLAPSE_EVENT));
    } catch {
      // ignore
    }
  }, []);
  return [enabled ? value : false, setValue];
}

interface ProfileSidebarProps {
  variant?: "desktop" | "drawer";
  onNavigate?: () => void;
}

export function ProfileSidebar({ variant = "desktop", onNavigate }: ProfileSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useCollapse(variant === "desktop");
  const t = useTranslations("profileNav");

  const showLabels = variant === "drawer" || !collapsed;

  const isActive = (href: string) => {
    if (href === "/profile") return pathname === "/profile";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          "flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
          variant === "desktop" && (collapsed ? "w-16" : "w-[240px]"),
          variant === "drawer" && "w-full",
          "transition-[width] duration-200",
        )}
        aria-label={t("title")}
      >
        <div
          className={cn(
            "flex h-14 items-center border-b border-sidebar-border px-3 shrink-0",
            showLabels ? "justify-between" : "justify-center",
          )}
        >
          {showLabels && (
            <span className="text-sm font-semibold">{t("title")}</span>
          )}
          {variant === "desktop" && showLabels && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("collapse")}
              onClick={() => setCollapsed(true)}
              className="h-8 w-8"
            >
              <ChevronLeft className="size-4 rtl:rotate-180" />
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1">
          <nav className={cn("py-3", showLabels ? "px-3" : "px-2")}>
            <ul className="space-y-0.5">
              {PROFILE_NAV.map((item) => {
                const active = isActive(item.href);
                const label = t(`items.${item.labelKey}` as `items.${typeof item.labelKey}`);
                const row = (
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-md py-2 text-sm transition-colors",
                      "hover:bg-muted/70",
                      showLabels ? "px-2" : "justify-center px-0",
                      active &&
                        "bg-sidebar-accent text-sidebar-accent-foreground font-medium hover:bg-sidebar-accent",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {active && (
                      <span className="absolute start-0 top-1 bottom-1 w-0.5 rounded-full bg-primary" />
                    )}
                    <item.icon
                      className={cn(
                        "size-4 shrink-0",
                        active ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                    {showLabels && <span className="flex-1 truncate">{label}</span>}
                  </Link>
                );

                if (showLabels) return <li key={item.href}>{row}</li>;
                return (
                  <li key={item.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>{row}</TooltipTrigger>
                      <TooltipContent side="right">{label}</TooltipContent>
                    </Tooltip>
                  </li>
                );
              })}
            </ul>
          </nav>
        </ScrollArea>

        {!showLabels && (
          <div className="border-t border-sidebar-border p-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setCollapsed(false)}
                  className="flex h-8 w-full items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
                  aria-label={t("expand")}
                >
                  <ChevronLeft className="size-4 rotate-180 rtl:rotate-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{t("expand")}</TooltipContent>
            </Tooltip>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
