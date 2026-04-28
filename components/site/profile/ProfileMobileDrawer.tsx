"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ProfileSidebar } from "./ProfileSidebar";

export function ProfileMobileDrawer() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("profileNav");
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("title")}
        onClick={() => setOpen(true)}
        className="md:hidden"
      >
        <Menu className="size-5" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-[260px]">
          <SheetTitle className="sr-only">{t("title")}</SheetTitle>
          <ProfileSidebar variant="drawer" onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
