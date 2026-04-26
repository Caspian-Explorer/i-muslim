"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EditorDialog,
  EditorDialogBody,
  EditorDialogContent,
  EditorDialogFooter,
  EditorDialogHeader,
  EditorDialogTitle,
} from "@/components/ui/editor-dialog";
import { FormGrid } from "@/components/admin/ui/form-layout";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { toast } from "@/components/ui/sonner";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/lib/admin/actions/business-taxonomies";
import { LOCALES, type Locale } from "@/i18n/config";
import type { BusinessCategory, LocalizedTextRequired } from "@/types/business";

interface Props {
  initialCategories: BusinessCategory[];
  canPersist: boolean;
}

interface FormState {
  slug: string;
  name: LocalizedTextRequired;
  iconKey: string;
  sortOrder: number;
  isActive: boolean;
}

const blankName = (): LocalizedTextRequired => ({ en: "", ar: "", tr: "", id: "" });

const blankForm = (): FormState => ({ slug: "", name: blankName(), iconKey: "", sortOrder: 0, isActive: true });

export function CategoriesClient({ initialCategories, canPersist }: Props) {
  const t = useTranslations("businesses.admin");
  const tCommon = useTranslations("common");
  const tLocale = useTranslations("locale");
  const [items, setItems] = useState(initialCategories);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessCategory | null>(null);
  const [form, setForm] = useState<FormState>(blankForm());
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BusinessCategory | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(blankForm());
    setOpen(true);
  }
  function openEdit(c: BusinessCategory) {
    setEditing(c);
    setForm({
      slug: c.slug,
      name: { ...blankName(), ...c.name },
      iconKey: c.iconKey ?? "",
      sortOrder: c.sortOrder,
      isActive: c.isActive,
    });
    setOpen(true);
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
      const result = editing
        ? await updateCategoryAction(editing.id, payload)
        : await createCategoryAction(payload);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (editing) {
        setItems((prev) =>
          prev.map((x) => (x.id === editing.id ? { ...x, ...payload, id: editing.id } : x)),
        );
        toast.success(t("taxonomyUpdatedToast"));
      } else {
        setItems((prev) => [...prev, { id: result.data.id, ...payload }]);
        toast.success(t("taxonomyCreatedToast"));
      }
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    if (!canPersist) {
      toast.error(t("noPersistToast"));
      return;
    }
    const r = await deleteCategoryAction(target.id);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    setItems((prev) => prev.filter((x) => x.id !== target.id));
    toast.success(t("taxonomyDeletedToast"));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} disabled={!canPersist}>
          <Plus className="size-4" /> {t("taxonomyAddCta")}
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t("taxonomyEmpty")}
        </p>
      ) : (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">{t("nameLocale", { locale: "EN" })}</th>
                <th className="px-3 py-2">{t("slug")}</th>
                <th className="px-3 py-2">{t("sortOrder")}</th>
                <th className="px-3 py-2">{t("isActive")}</th>
                <th className="px-3 py-2 text-end">{tCommon("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {[...items]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-3 py-2.5 font-medium">{c.name.en}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{c.slug}</td>
                    <td className="px-3 py-2.5">{c.sortOrder}</td>
                    <td className="px-3 py-2.5">
                      {c.isActive ? <Badge variant="success">●</Badge> : <Badge>—</Badge>}
                    </td>
                    <td className="px-3 py-2.5 text-end">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(c)}>
                        <Trash2 className="size-4 text-danger" />
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <EditorDialog open={open} onOpenChange={setOpen}>
        <EditorDialogContent>
          <form onSubmit={submit} className="flex h-full flex-col">
            <EditorDialogHeader>
              <EditorDialogTitle>{editing ? t("taxonomyEditCta") : t("taxonomyAddCta")}</EditorDialogTitle>
            </EditorDialogHeader>
            <EditorDialogBody className="space-y-3">
              <FormGrid>
                <div className="space-y-1.5">
                  <Label>{t("slug")}</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))}
                    disabled={Boolean(editing)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("iconKey")}</Label>
                  <Input
                    value={form.iconKey}
                    onChange={(e) => setForm((s) => ({ ...s, iconKey: e.target.value }))}
                  />
                </div>
              </FormGrid>
              <FormGrid cols={3}>
                {(LOCALES as readonly Locale[]).map((l) => (
                  <div key={l} className="space-y-1.5">
                    <Label>{t("nameLocale", { locale: tLocale(l) })}</Label>
                    <Input
                      value={form.name[l]}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, name: { ...s.name, [l]: e.target.value } }))
                      }
                      dir={l === "ar" ? "rtl" : undefined}
                      lang={l}
                      required
                    />
                  </div>
                ))}
              </FormGrid>
              <FormGrid>
                <div className="space-y-1.5">
                  <Label>{t("sortOrder")}</Label>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((s) => ({ ...s, sortOrder: Number(e.target.value) }))}
                  />
                </div>
                <label className="flex items-center gap-2 self-end pb-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))}
                  />
                  {t("isActive")}
                </label>
              </FormGrid>
            </EditorDialogBody>
            <EditorDialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={submitting || !canPersist}>
                {submitting ? t("saving") : editing ? t("save") : t("create")}
              </Button>
            </EditorDialogFooter>
          </form>
        </EditorDialogContent>
      </EditorDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={t("taxonomyDeleteTitle")}
        description={t("taxonomyDeleteDescription", { name: deleteTarget?.name.en ?? "" })}
        confirmLabel={t("taxonomyDeleteCta")}
        onConfirm={handleDelete}
      />
    </div>
  );
}
