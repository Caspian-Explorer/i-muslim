"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { updateSiteIdentityAction } from "@/app/[locale]/(admin)/admin/settings/_actions";

interface Props {
  initial: {
    siteName: string;
    tagline: string;
  };
}

export function SiteIdentityForm({ initial }: Props) {
  const t = useTranslations("adminSettings.general");
  const [siteName, setSiteName] = useState(initial.siteName);
  const [tagline, setTagline] = useState(initial.tagline);
  const [pending, startTransition] = useTransition();

  const dirty = siteName !== initial.siteName || tagline !== initial.tagline;
  const valid = siteName.trim().length > 0;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty || !valid) return;
    startTransition(async () => {
      const result = await updateSiteIdentityAction({ siteName, tagline });
      if (result.ok) {
        toast.success(t("savedToast"));
      } else {
        toast.error(t("errorToast"));
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="site-name">{t("siteNameLabel")}</Label>
        <Input
          id="site-name"
          value={siteName}
          maxLength={80}
          onChange={(e) => setSiteName(e.target.value)}
          disabled={pending}
        />
        <p className="text-xs text-muted-foreground">{t("siteNameHint")}</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tagline">{t("taglineLabel")}</Label>
        <textarea
          id="tagline"
          className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={tagline}
          maxLength={160}
          onChange={(e) => setTagline(e.target.value)}
          disabled={pending}
        />
        <p className="text-xs text-muted-foreground">{t("taglineHint")}</p>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!dirty || !valid || pending}>
          {pending ? t("saving") : t("save")}
        </Button>
        {dirty && (
          <span className="text-xs text-muted-foreground">{t("unsavedChanges")}</span>
        )}
      </div>
    </form>
  );
}
