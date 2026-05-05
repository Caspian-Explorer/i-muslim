"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
  createArticleCategoryAction,
  updateArticleCategoryAction,
  deleteArticleCategoryAction,
} from "@/lib/admin/actions/article-categories";
import { BUNDLED_LOCALES, type BundledLocale } from "@/i18n/config";
import { slugify } from "@/lib/blog/slug";
import type { ArticleCategoryDoc } from "@/types/blog";

interface Props {
  initialCategories: ArticleCategoryDoc[];
  canPersist: boolean;
}

interface FormState {
  slug: string;
  name: ArticleCategoryDoc["name"];
  iconKey: string;
  sortOrder: number;
  isActive: boolean;
}

const blankName = (): ArticleCategoryDoc["name"] => ({ en: "", ar: "", tr: "", id: "" });

const blankForm = (): FormState => ({
  slug: "",
  name: blankName(),
  iconKey: "",
  sortOrder: 0,
  isActive: true,
});

const LOCALE_LABEL: Record<BundledLocale, string> = {
  en: "English",
  ar: "Arabic",
  tr: "Turkish",
  id: "Indonesian",
};

export function CategoriesClient({ initialCategories, canPersist }: Props) {
  const [items, setItems] = useState(initialCategories);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ArticleCategoryDoc | null>(null);
  const [form, setForm] = useState<FormState>(blankForm());
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ArticleCategoryDoc | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(blankForm());
    setSlugTouched(false);
    setOpen(true);
  }
  function openEdit(c: ArticleCategoryDoc) {
    setEditing(c);
    setForm({
      slug: c.slug,
      name: { ...blankName(), ...c.name },
      iconKey: c.iconKey ?? "",
      sortOrder: c.sortOrder,
      isActive: c.isActive,
    });
    setSlugTouched(true);
    setOpen(true);
  }

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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canPersist) {
      toast.error("Firebase Admin is not configured.");
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
        ? await updateArticleCategoryAction(editing.id, payload)
        : await createArticleCategoryAction(payload);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (editing) {
        setItems((prev) =>
          prev.map((x) => (x.id === editing.id ? { ...x, ...payload, id: editing.id } : x)),
        );
        toast.success("Category updated.");
      } else {
        setItems((prev) => [...prev, { id: result.data.id, ...payload }]);
        toast.success("Category created.");
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
      toast.error("Firebase Admin is not configured.");
      return;
    }
    const r = await deleteArticleCategoryAction(target.id);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    setItems((prev) => prev.filter((x) => x.id !== target.id));
    toast.success("Category deleted.");
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} disabled={!canPersist}>
          <Plus className="size-4" /> Add category
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No categories yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Name (EN)</th>
                <th className="px-3 py-2">Slug</th>
                <th className="px-3 py-2">Sort</th>
                <th className="px-3 py-2">Active</th>
                <th className="px-3 py-2 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...items]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-3 py-2.5 font-medium">{c.name.en}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{c.slug}</td>
                    <td className="px-3 py-2.5 tabular-nums">{c.sortOrder}</td>
                    <td className="px-3 py-2.5">
                      {c.isActive ? <Badge variant="success">●</Badge> : <Badge>—</Badge>}
                    </td>
                    <td className="px-3 py-2.5 text-end">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(c)} aria-label="Edit">
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(c)} aria-label="Delete">
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
              <EditorDialogTitle>
                {editing ? "Edit category" : "Add category"}
              </EditorDialogTitle>
            </EditorDialogHeader>
            <EditorDialogBody className="space-y-3">
              <FormGrid>
                <div className="space-y-1.5">
                  <Label>Slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    disabled={Boolean(editing)}
                    required
                    placeholder="auto-generated from English name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Icon key (optional)</Label>
                  <Input
                    value={form.iconKey}
                    onChange={(e) => setForm((s) => ({ ...s, iconKey: e.target.value }))}
                  />
                </div>
              </FormGrid>
              <FormGrid cols={3}>
                {(BUNDLED_LOCALES as readonly BundledLocale[]).map((l) => (
                  <div key={l} className="space-y-1.5">
                    <Label>Name ({LOCALE_LABEL[l]})</Label>
                    <Input
                      value={form.name[l]}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (l === "en") handleEnglishNameChange(value);
                        else setForm((s) => ({ ...s, name: { ...s.name, [l]: value } }));
                      }}
                      dir={l === "ar" ? "rtl" : undefined}
                      lang={l}
                      required
                    />
                  </div>
                ))}
              </FormGrid>
              <FormGrid>
                <div className="space-y-1.5">
                  <Label>Sort order</Label>
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
                  Active
                </label>
              </FormGrid>
            </EditorDialogBody>
            <EditorDialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !canPersist}>
                {submitting ? "Saving…" : editing ? "Save" : "Create"}
              </Button>
            </EditorDialogFooter>
          </form>
        </EditorDialogContent>
      </EditorDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete category"
        description={
          deleteTarget
            ? `This permanently deletes "${deleteTarget.name.en}". Articles still using this slug will keep it as a string but will no longer match a known category. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        confirmWord={deleteTarget?.slug}
        onConfirm={handleDelete}
      />
    </div>
  );
}
