"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { BUNDLED_LOCALES, LOCALE_META, type BundledLocale } from "@/i18n/config";
import { slugify } from "@/lib/blog/slug";
import { cn } from "@/lib/utils";
import {
  createEventCategoryAction,
  updateEventCategoryAction,
} from "@/lib/admin/actions/event-categories";
import type { EventCategoryDoc } from "@/types/event-category";
import type { LocalizedTextRequired } from "@/types/business";

interface FormState {
  slug: string;
  name: LocalizedTextRequired;
  iconKey: string;
  sortOrder: number;
  isActive: boolean;
}

const blankName = (): LocalizedTextRequired => ({ en: "", ar: "", tr: "", id: "" });

const blankForm = (): FormState => ({
  slug: "",
  name: blankName(),
  iconKey: "",
  sortOrder: 0,
  isActive: true,
});

interface Props {
  category: EventCategoryDoc | null;
  canPersist: boolean;
  onSaved: (saved: EventCategoryDoc) => void;
  onCancel: () => void;
}

export function EventCategoryForm({ category, canPersist, onSaved, onCancel }: Props) {
  const t = useTranslations("events.admin");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(category);
  const [activeLocale, setActiveLocale] = useState<BundledLocale>("en");
  const [submitting, setSubmitting] = useState(false);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [form, setForm] = useState<FormState>(() =>
    category
      ? {
          slug: category.slug,
          name: { ...blankName(), ...category.name },
          iconKey: category.iconKey ?? "",
          sortOrder: category.sortOrder,
          isActive: category.isActive,
        }
      : blankForm(),
  );

  function handleEnglishNameChange(value: string) {
    setForm((s) => ({
      ...s,
      name: { ...s.name, en: value },
      slug: slugTouched ? s.slug : slugify(value),
    }));
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    setForm((s) => ({ ...s, slug: value }));
  }

  function handleNameChange(locale: BundledLocale, value: string) {
    if (locale === "en") {
      handleEnglishNameChange(value);
      return;
    }
    setForm((s) => ({ ...s, name: { ...s.name, [locale]: value } }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canPersist) {
      toast.error(t("noPersistToast"));
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        slug: form.slug.trim(),
        name: form.name,
        iconKey: form.iconKey.trim() || undefined,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      const result = category
        ? await updateEventCategoryAction(category.id, payload)
        : await createEventCategoryAction(payload);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(category ? t("taxonomyUpdatedToast") : t("taxonomyCreatedToast"));
      onSaved({
        id: result.data.id,
        slug: payload.slug,
        name: payload.name,
        iconKey: payload.iconKey,
        sortOrder: payload.sortOrder,
        isActive: payload.isActive,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex h-full min-h-0 flex-col overflow-hidden"
    >
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          <aside className="space-y-4 md:border-e md:border-border md:pe-5">
            <div>
              <Label htmlFor="evcat-slug">{t("slug")}</Label>
              <Input
                id="evcat-slug"
                className="mt-1"
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                disabled={isEdit}
                required
              />
            </div>
            <div>
              <Label htmlFor="evcat-icon">{t("iconKey")}</Label>
              <Input
                id="evcat-icon"
                className="mt-1"
                value={form.iconKey}
                onChange={(e) => setForm((s) => ({ ...s, iconKey: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="evcat-sort">{t("sortOrder")}</Label>
              <Input
                id="evcat-sort"
                className="mt-1"
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((s) => ({ ...s, sortOrder: Number(e.target.value) }))
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))}
              />
              {t("isActive")}
            </label>
          </aside>

          <div className="space-y-3">
            <Tabs
              value={activeLocale}
              onValueChange={(v) => setActiveLocale(v as BundledLocale)}
            >
              <TabsList>
                {BUNDLED_LOCALES.map((loc) => {
                  const has = form.name[loc].trim().length > 0;
                  return (
                    <TabsTrigger key={loc} value={loc}>
                      <span>{LOCALE_META[loc].englishName}</span>
                      {has && (
                        <span className="ms-1.5 size-1.5 rounded-full bg-primary inline-block" />
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>

            <div>
              <Label htmlFor={`evcat-name-${activeLocale}`}>
                {t("nameLocale", { locale: LOCALE_META[activeLocale].englishName })}
              </Label>
              <Input
                id={`evcat-name-${activeLocale}`}
                className={cn("mt-1", activeLocale === "ar" && "text-right")}
                dir={activeLocale === "ar" ? "rtl" : undefined}
                lang={activeLocale}
                value={form.name[activeLocale]}
                onChange={(e) => handleNameChange(activeLocale, e.target.value)}
                required
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
