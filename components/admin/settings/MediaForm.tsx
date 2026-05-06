"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SiteAssetUploader } from "./SiteAssetUploader";
import type { SiteUploadKind } from "@/lib/site-config/storage";

type AssetState = { storagePath: string | null; url: string | null };

interface Props {
  initial: {
    logo: AssetState;
    favicon: AssetState;
    og: AssetState;
    articlePlaceholder: AssetState;
  };
}

const KIND_ORDER: { kind: SiteUploadKind; titleKey: string; hintKey: string }[] = [
  { kind: "logo", titleKey: "logoLabel", hintKey: "logoHint" },
  { kind: "favicon", titleKey: "faviconLabel", hintKey: "faviconHint" },
  { kind: "og", titleKey: "ogImageLabel", hintKey: "ogImageHint" },
  {
    kind: "articlePlaceholder",
    titleKey: "articlePlaceholderLabel",
    hintKey: "articlePlaceholderHint",
  },
];

export function MediaForm({ initial }: Props) {
  const t = useTranslations("adminSettings.media");
  const [state, setState] = useState(initial);

  function setKind(kind: SiteUploadKind, next: AssetState) {
    setState((prev) => ({ ...prev, [kind]: next }));
  }

  return (
    <div className="space-y-8">
      {KIND_ORDER.map(({ kind, titleKey, hintKey }) => {
        const value = state[kind];
        return (
          <section key={kind} className="space-y-2">
            <div>
              <h3 className="text-base font-semibold">{t(titleKey)}</h3>
              <p className="text-xs text-muted-foreground">{t(hintKey)}</p>
            </div>
            <SiteAssetUploader
              kind={kind}
              storagePath={value.storagePath}
              url={value.url}
              onChange={(next) => setKind(kind, next)}
            />
          </section>
        );
      })}
    </div>
  );
}
