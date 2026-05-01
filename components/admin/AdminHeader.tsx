import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { Breadcrumbs } from "./Breadcrumbs";
import { CommandPalette } from "./CommandPalette";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileSidebarDrawer } from "./MobileSidebarDrawer";
import { NotificationsPopover } from "./NotificationsPopover";
import { ThemeMenu } from "./ThemeMenu";
import { UserMenu } from "./UserMenu";
import type { SidebarBadges } from "./Sidebar";
import type { AdminSession } from "@/lib/auth/session";
import { BUNDLED_LOCALES } from "@/i18n/config";
import { listActivatedReservedLocales } from "@/lib/admin/data/ui-locales";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
  session: AdminSession;
  badges?: SidebarBadges;
}

export async function AdminHeader({ session, badges }: AdminHeaderProps) {
  const activated = await listActivatedReservedLocales();
  const availableLocales = [...BUNDLED_LOCALES, ...activated];
  const tSidebar = await getTranslations("sidebar");
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
      <MobileSidebarDrawer badges={badges} />
      <div className="hidden md:flex flex-1 min-w-0 items-center gap-4">
        <Breadcrumbs />
      </div>
      <div className="md:hidden flex-1 min-w-0">
        <Breadcrumbs />
      </div>
      <div className="ml-auto flex items-center gap-1">
        <div className="hidden md:block">
          <CommandPalette />
        </div>
        <LanguageSwitcher availableLocales={availableLocales} />
        <ThemeMenu />
        <NotificationsPopover />
        <Button
          variant="ghost"
          size="icon"
          aria-label={tSidebar("newButton")}
          title={tSidebar("newButton")}
        >
          <Plus className="size-4" />
        </Button>
        <UserMenu name={session.name} email={session.email} picture={session.picture} />
      </div>
    </header>
  );
}
