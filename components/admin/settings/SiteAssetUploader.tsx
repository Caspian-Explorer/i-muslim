"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import {
  getSiteUploadUrlAction,
  deleteSiteAssetAction,
  updateSiteAssetAction,
} from "@/app/[locale]/(admin)/admin/settings/media/_actions";
import type { SiteUploadKind } from "@/lib/site-config/storage";

interface KindUiSpec {
  accept: string[];
  maxBytes: number;
  previewClassName: string;
}

const SPECS: Record<SiteUploadKind, KindUiSpec> = {
  logo: {
    accept: ["image/png", "image/svg+xml", "image/webp", "image/jpeg"],
    maxBytes: 2 * 1024 * 1024,
    previewClassName: "h-24 w-auto object-contain",
  },
  favicon: {
    // Browsers commonly report .ico as either of these.
    accept: ["image/x-icon", "image/vnd.microsoft.icon", "image/png", "image/svg+xml"],
    maxBytes: 256 * 1024,
    previewClassName: "h-12 w-12 object-contain",
  },
  og: {
    accept: ["image/png", "image/jpeg", "image/webp"],
    maxBytes: 4 * 1024 * 1024,
    previewClassName: "h-40 w-auto object-contain",
  },
  articlePlaceholder: {
    accept: ["image/png", "image/jpeg", "image/webp"],
    maxBytes: 4 * 1024 * 1024,
    previewClassName: "h-40 w-auto object-contain",
  },
};

interface Props {
  kind: SiteUploadKind;
  storagePath: string | null;
  url: string | null;
  onChange: (next: { storagePath: string | null; url: string | null }) => void;
}

export function SiteAssetUploader({ kind, storagePath, url, onChange }: Props) {
  const t = useTranslations("adminSettings.media");
  const [busy, setBusy] = useState(false);
  const spec = SPECS[kind];
  // .ico files often come through with no MIME, so accept by extension too.
  const acceptAttr =
    kind === "favicon" ? [...spec.accept, ".ico"].join(",") : spec.accept.join(",");

  async function persist(nextStoragePath: string | null) {
    const result = await updateSiteAssetAction({ kind, storagePath: nextStoragePath });
    if (!result.ok) {
      toast.error(t("savedError"));
      return false;
    }
    return true;
  }

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    // Some browsers report `.ico` files with an empty type — accept them when
    // the extension matches. Otherwise enforce the MIME allowlist.
    const fileType =
      file.type ||
      (kind === "favicon" && /\.ico$/i.test(file.name) ? "image/x-icon" : "");
    if (!spec.accept.includes(fileType)) {
      toast.error(t("typeError"));
      return;
    }
    if (file.size > spec.maxBytes) {
      toast.error(t("sizeError"));
      return;
    }

    setBusy(true);
    try {
      const result = await getSiteUploadUrlAction({
        kind,
        filename: file.name,
        contentType: fileType,
        contentLength: file.size,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const putRes = await fetch(result.data.url, {
        method: "PUT",
        headers: { "content-type": fileType },
        body: file,
      });
      if (!putRes.ok) {
        toast.error(t("uploadFailed"));
        return;
      }
      // Best-effort cleanup of the previous blob — orphans accumulate without
      // this when the admin replaces an asset.
      const oldPath = storagePath;
      const ok = await persist(result.data.storagePath);
      if (!ok) {
        // Roll back the upload so we don't leave an orphaned blob.
        await deleteSiteAssetAction(result.data.storagePath).catch(() => {});
        return;
      }
      // Compute the public URL on the client; matches the storage helper.
      const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
      const newUrl = bucket
        ? `https://storage.googleapis.com/${bucket}/${encodeURI(result.data.storagePath)}`
        : result.data.storagePath;
      onChange({ storagePath: result.data.storagePath, url: newUrl });
      if (oldPath) {
        await deleteSiteAssetAction(oldPath).catch(() => {});
      }
      toast.success(t("savedToast"));
    } catch {
      toast.error(t("uploadFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!storagePath) {
      onChange({ storagePath: null, url: null });
      return;
    }
    setBusy(true);
    try {
      const ok = await persist(null);
      if (!ok) return;
      const oldPath = storagePath;
      onChange({ storagePath: null, url: null });
      await deleteSiteAssetAction(oldPath).catch(() => {});
      toast.success(t("savedToast"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {url ? (
        <div className="relative w-fit overflow-hidden rounded-md border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className={spec.previewClassName} />
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className="absolute end-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded bg-background/90 text-danger hover:bg-background disabled:opacity-50"
            aria-label={t("remove")}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <label
          className={
            "inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-muted " +
            (busy ? "cursor-not-allowed opacity-50" : "")
          }
        >
          <Plus className="size-4" />
          {busy ? t("uploading") : url ? t("replace") : t("upload")}
          <input
            type="file"
            accept={acceptAttr}
            className="hidden"
            onChange={handleSelect}
            disabled={busy}
          />
        </label>
      </div>
    </div>
  );
}
