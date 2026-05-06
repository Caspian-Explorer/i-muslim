"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  getMosqueUploadUrlAction,
  deleteMosqueImageAction,
} from "@/app/[locale]/(admin)/admin/mosques/actions";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

interface Props {
  /** Slug for the in-progress mosque (or "_new" for create mode). */
  slug: string;
  kind: "cover" | "logo";
  /** Storage path of the currently-selected image, if any. */
  value: string;
  /** Public URL for displaying the currently-selected image, if known. */
  previewUrl: string;
  onChange: (next: { storagePath: string; url: string } | null) => void;
  disabled?: boolean;
}

function publicUrlFor(storagePath: string): string {
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (bucket) {
    return `https://storage.googleapis.com/${bucket}/${encodeURI(storagePath)}`;
  }
  // Without a configured bucket the upload itself wouldn't have succeeded —
  // returning the path keeps the UI from rendering broken `src=""`.
  return storagePath;
}

/**
 * Single-image uploader backed by Firebase Storage. Mirrors the multi-photo
 * pattern in [components/admin/businesses/PhotoUploader.tsx] but kept as a
 * separate component because the mosque form treats cover and logo as singular
 * fields with different storage prefixes.
 */
export function MosqueImageUploader({
  slug,
  kind,
  value,
  previewUrl,
  onChange,
  disabled,
}: Props) {
  const t = useTranslations("mosquesAdmin.media");
  const [uploading, setUploading] = useState(false);

  const displayUrl = value ? publicUrlFor(value) : previewUrl || "";

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(t("typeError"));
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(t("sizeError"));
      return;
    }

    setUploading(true);
    try {
      const result = await getMosqueUploadUrlAction({
        slug,
        kind,
        filename: file.name,
        contentType: file.type,
        contentLength: file.size,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const putRes = await fetch(result.data.url, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!putRes.ok) {
        toast.error(t("uploadFailed"));
        return;
      }
      // Best-effort cleanup of the previous blob so we don't accumulate orphans
      // when the admin replaces an image. The form's prior `value` is the only
      // reference we have at this point in the flow.
      if (value) {
        await deleteMosqueImageAction(value).catch(() => {});
      }
      onChange({
        storagePath: result.data.storagePath,
        url: publicUrlFor(result.data.storagePath),
      });
    } catch {
      toast.error(t("uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (!value) {
      onChange(null);
      return;
    }
    onChange(null);
    await deleteMosqueImageAction(value).catch(() => {});
  }

  return (
    <div className="space-y-2">
      {displayUrl ? (
        <div className="relative w-fit overflow-hidden rounded-md border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayUrl}
            alt=""
            className="block h-32 w-auto max-w-full object-contain bg-muted"
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || uploading}
            className="absolute end-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded bg-background/90 text-danger hover:bg-background"
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
            (disabled || uploading ? "cursor-not-allowed opacity-50" : "")
          }
        >
          <Plus className="size-4" />
          {uploading ? t("uploading") : displayUrl ? t("replace") : t("upload")}
          <input
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            className="hidden"
            onChange={handleSelect}
            disabled={disabled || uploading}
          />
        </label>
        <span className="text-xs text-muted-foreground">{t("limitHint")}</span>
      </div>
    </div>
  );
}
