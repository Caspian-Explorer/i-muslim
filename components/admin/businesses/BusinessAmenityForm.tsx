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
  createAmenityAction,
  updateAmenityAction,
} from "@/lib/admin/actions/business-taxonomies";
import type { BusinessAmenity, LocalizedTextRequired } from "@/types/business";

interface FormState {
  slug: string;
  name: LocalizedTextRequired;
  iconKey: string;
}

const blankName = (): LocalizedTextRequired => ({ en: "", ar: "", tr: "", id: "" });

const blankForm = (): FormState => ({ slug: "", name: blankName(), iconKey: "" });

interface Props {
  amenity: BusinessAmenity | null;
  canPersist: boolean;
  onSaved: (saved: BusinessAmenity) => void;
  onCancel: () => void;
}

export function BusinessAmenityForm({ amenity, canPersist, onSaved, onCancel }: Props) {
  const t = useTranslations("businesses.admin");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(amenity);
  const [activeLocale, setActiveLocale] = useState<BundledLocale>("en");
  const [submitting, setSubmitting] = useState(false);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [form, setForm] = useState<FormState>(() =>
    amenity
      ? {
          slug: amenity.slug,
          name: { ...blankName(), ...amenity.name },
          iconKey: amenity.iconKey ?? "",
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
      };
      const result = amenity
        ? await updateAmenityAction(amenity.id, payload)
        : await createAmenityAction(payload);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(amenity ? t("taxonomyUpdatedToast") : t("taxonomyCreatedToast"));
      onSaved({
        id: result.data.id,
        slug: payload.slug,
        name: payload.name,
        iconKey: payload.iconKey,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          <aside className="space-y-4 md:border-e md:border-border md:pe-5">
            <div>
              <Label htmlFor="bam-slug">{t("slug")}</Label>
              <Input
                id="bam-slug"
                className="mt-1"
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                disabled={isEdit}
                required
              />
            </div>
            <div>
              <Label htmlFor="bam-icon">{t("iconKey")}</Label>
              <Input
                id="bam-icon"
                className="mt-1"
                value={form.iconKey}
                onChange={(e) => setForm((s) => ({ ...s, iconKey: e.target.value }))}
              />
            </div>
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
              <Label htmlFor={`bam-name-${activeLocale}`}>
                {t("nameLocale", { locale: LOCALE_META[activeLocale].englishName })}
              </Label>
              <Input
                id={`bam-name-${activeLocale}`}
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
