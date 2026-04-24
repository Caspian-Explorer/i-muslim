import { Breadcrumbs } from "./Breadcrumbs";
import { CommandPalette } from "./CommandPalette";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileSidebarDrawer } from "./MobileSidebarDrawer";
import { NotificationsPopover } from "./NotificationsPopover";
import { ThemeMenu } from "./ThemeMenu";
import { UserMenu } from "./UserMenu";
import type { SidebarBadges } from "./Sidebar";
import type { AdminSession } from "@/lib/auth/session";

interface AdminHeaderProps {
  session: AdminSession;
  badges?: SidebarBadges;
}

export function AdminHeader({ session, badges }: AdminHeaderProps) {
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
        <LanguageSwitcher />
        <ThemeMenu />
        <NotificationsPopover />
        <UserMenu name={session.name} email={session.email} picture={session.picture} />
      </div>
    </header>
  );
}
