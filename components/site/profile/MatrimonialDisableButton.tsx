"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { disableMatrimonialAction } from "@/app/[locale]/(site)/profile/matrimonial/actions";

export function MatrimonialDisableButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const t = useTranslations("profileMatrimonial");

  function handleClick() {
    if (typeof window !== "undefined" && !window.confirm(t("disableConfirm"))) return;
    startTransition(async () => {
      const result = await disableMatrimonialAction();
      if (!result.ok) {
        toast.error(result.error ?? t("disableFailed"));
        return;
      }
      toast.success(t("disabledToast"));
      router.refresh();
    });
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleClick} disabled={pending}>
      <Power /> {pending ? t("disabling") : t("disable")}
    </Button>
  );
}
