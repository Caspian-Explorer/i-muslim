"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

interface Props {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: Props) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations("eventsPublic.share");

  function absoluteUrl(): string {
    if (typeof window === "undefined") return url;
    try {
      return new URL(url, window.location.origin).toString();
    } catch {
      return url;
    }
  }

  async function handleShare() {
    const target = absoluteUrl();
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, url: target });
        return;
      } catch {
        // user cancelled or unsupported — fall through to copy
      }
    }
    await handleCopy();
  }

  async function handleCopy() {
    const target = absoluteUrl();
    try {
      await navigator.clipboard.writeText(target);
      setCopied(true);
      toast.success(t("copied"));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  return (
    <div className="inline-flex items-center gap-1">
      <Button variant="secondary" size="sm" onClick={handleShare}>
        <Share2 className="size-3.5" /> {t("share")}
      </Button>
      <Button variant="ghost" size="sm" onClick={handleCopy} aria-label={t("copyLink")}>
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </Button>
    </div>
  );
}
