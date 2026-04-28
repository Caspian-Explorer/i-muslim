import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSiteSession } from "@/lib/auth/session";
import { ProfileSidebar } from "@/components/site/profile/ProfileSidebar";
import { ProfileMobileDrawer } from "@/components/site/profile/ProfileMobileDrawer";

export default async function ProfileLayout({ children }: { children: ReactNode }) {
  const session = await getSiteSession();
  if (!session) {
    redirect("/login?callbackUrl=/profile");
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <div className="hidden md:block shrink-0 sticky top-0 self-start h-screen">
        <ProfileSidebar variant="desktop" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 md:hidden">
          <ProfileMobileDrawer />
        </div>
        {children}
      </div>
    </div>
  );
}
