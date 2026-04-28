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
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <div className="flex items-center gap-2 pb-3 md:hidden">
        <ProfileMobileDrawer />
      </div>
      <div className="flex gap-6">
        <aside className="hidden md:block sticky top-20 self-start">
          <ProfileSidebar variant="desktop" />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
