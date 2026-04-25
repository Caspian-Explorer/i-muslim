"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import {
  getBusinessUploadUrlAction,
  deleteBusinessPhotoAction,
} from "@/lib/admin/actions/businesses";
import type { BusinessPhoto } from "@/types/business";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS = 6;

interface Props {
  businessId: string;
  value: BusinessPhoto[];
  onChange: (next: BusinessPhoto[]) => void;
  disabled?: boolean;
}

function publicUrlFor(storagePath: string): string {
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (bucket) {
    return `https://storage.googleapis.com/${bucket}/${encodeURI(storagePath)}`;
  }
  return storagePath;
}

export function PhotoUploader({ businessId, value, onChange, disabled }: Props) {
  const t = useTranslations("businesses.admin");
  const [uploading, setUploading] = useState(false);

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(t("photoTypeError"));
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(t("photoSizeError"));
      return;
    }
    if (value.length >= MAX_PHOTOS) {
      toast.error(t("photoLimit"));
      return;
    }

    setUploading(true);
    try {
      const result = await getBusinessUploadUrlAction({
        businessId,
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
        headers: {
          "content-type": file.type,
        },
        body: file,
      });
      if (!putRes.ok) {
        toast.error(t("uploadFailedToast"));
        return;
      }
      const dims = await readImageDimensions(file).catch(() => null);
      onChange([
        ...value,
        {
          storagePath: result.data.storagePath,
          alt: file.name,
          width: dims?.width,
          height: dims?.height,
        },
      ]);
    } catch {
      toast.error(t("uploadFailedToast"));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(idx: number) {
    const photo = value[idx];
    if (!photo) return;
    onChange(value.filter((_, i) => i !== idx));
    if (businessId) {
      await deleteBusinessPhotoAction(businessId, photo.storagePath);
    }
  }

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((photo, idx) => (
            <li key={photo.storagePath} className="relative overflow-hidden rounded-md border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={publicUrlFor(photo.storagePath)}
                alt={photo.alt ?? ""}
                className="aspect-[4/3] w-full object-cover"
              />
              {idx === 0 && (
                <span className="absolute start-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {t("primaryPhoto")}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(idx)}
                className="absolute end-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded bg-background/90 text-danger hover:bg-background"
                aria-label={t("deletePhoto")}
                disabled={disabled}
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2">
        <label
          className={
            "inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-muted " +
            ((disabled || uploading || value.length >= MAX_PHOTOS) ? " cursor-not-allowed opacity-50" : "")
          }
        >
          <Plus className="size-4" />
          {uploading ? t("uploading") : t("uploadPhoto")}
          <input
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            className="hidden"
            onChange={handleSelect}
            disabled={disabled || uploading || value.length >= MAX_PHOTOS}
          />
        </label>
        <span className="text-xs text-muted-foreground">{t("photoLimit")}</span>
      </div>
    </div>
  );
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}
