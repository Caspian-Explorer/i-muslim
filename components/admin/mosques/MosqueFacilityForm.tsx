"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { slugify } from "@/lib/blog/slug";
import {
  createMosqueFacilityAction,
  updateMosqueFacilityAction,
} from "@/lib/admin/actions/mosque-facilities";
import type { MosqueFacility } from "@/types/mosque";

interface FormState {
  slug: string;
  name: string;
  iconKey: string;
  sortOrder: string;
}

interface Props {
  facility: MosqueFacility | null;
  canPersist: boolean;
  onSaved: (saved: MosqueFacility) => void;
  onCancel: () => void;
}

export function MosqueFacilityForm({ facility, canPersist, onSaved, onCancel }: Props) {
  const t = useTranslations("mosquesAdmin.facilities");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(facility);
  const [submitting, setSubmitting] = useState(false);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [form, setForm] = useState<FormState>(() =>
    facility
      ? {
          slug: facility.slug,
          name: facility.name,
          iconKey: facility.iconKey ?? "",
          sortOrder: String(facility.sortOrder ?? 999),
        }
      : { slug: "", name: "", iconKey: "", sortOrder: "999" },
  );

  function handleNameChange(value: string) {
    setForm((s) => ({
      ...s,
      name: value,
      // The slug auto-derives from name keystrokes until the admin touches the
      // slug field directly — same pattern as BusinessAmenityForm.
      slug: slugTouched ? s.slug : slugify(value),
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canPersist) {
      toast.error(t("noPersistToast"));
      return;
    }
    setSubmitting(true);
    try {
      const sortOrder = Number.parseInt(form.sortOrder, 10);
      const payload = {
        slug: form.slug.trim(),
        name: form.name.trim(),
        iconKey: form.iconKey.trim() || undefined,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 999,
      };
      const result = facility
        ? await updateMosqueFacilityAction(facility.id, payload)
        : await createMosqueFacilityAction(payload);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(facility ? t("updatedToast") : t("createdToast"));
      onSaved({
        id: result.data.id,
        slug: payload.slug,
        name: payload.name,
        iconKey: payload.iconKey,
        sortOrder: payload.sortOrder,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
        <div className="grid gap-4 max-w-xl">
          <div>
            <Label htmlFor="mf-name">{t("name")}</Label>
            <Input
              id="mf-name"
              className="mt-1"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="mf-slug">{t("slug")}</Label>
            <Input
              id="mf-slug"
              className="mt-1 font-mono text-xs"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((s) => ({ ...s, slug: e.target.value }));
              }}
              disabled={isEdit}
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">{t("slugHint")}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="mf-icon">{t("iconKey")}</Label>
              <Input
                id="mf-icon"
                className="mt-1"
                value={form.iconKey}
                onChange={(e) => setForm((s) => ({ ...s, iconKey: e.target.value }))}
                placeholder="utensils, parking-circle…"
              />
            </div>
            <div>
              <Label htmlFor="mf-sort">{t("sortOrder")}</Label>
              <Input
                id="mf-sort"
                className="mt-1"
                type="number"
                min={0}
                max={999}
                value={form.sortOrder}
                onChange={(e) => setForm((s) => ({ ...s, sortOrder: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border bg-background px-5 py-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          <X /> {tCommon("cancel")}
        </Button>
        <Button type="submit" disabled={submitting || !canPersist}>
          <Save /> {submitting ? t("saving") : isEdit ? t("save") : t("create")}
        </Button>
      </div>
    </form>
  );
}
