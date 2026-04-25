"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function ShareCopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations("articles.share");
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          /* ignore */
        }
      }}
    >
      {copied ? <Check /> : <Copy />} {copied ? t("copied") : t("copy")}
    </Button>
  );
}
