"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, Edit, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  EditorDialog,
  EditorDialogBody,
  EditorDialogContent,
  EditorDialogFooter,
} from "@/components/ui/editor-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MosqueProfile } from "@/components/mosque/MosqueProfile";
import { toast } from "sonner";
import { formatRelative } from "@/lib/utils";
import type { Mosque, MosqueSubmission } from "@/types/mosque";
import {
  promoteSubmission,
  rejectSubmission,
} from "@/app/[locale]/(admin)/admin/mosques/actions";

export type MosqueViewSource =
  | { kind: "mosque"; data: Mosque }
  | { kind: "submission"; data: MosqueSubmission };

function citySlugFor(city: string): string {
  return city
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "city";
}

function submissionToMosque(s: MosqueSubmission): Mosque {
  return {
    ...s.payload,
    slug: s.id,
    status: "pending_review",
    citySlug: citySlugFor(s.payload.city),
    countrySlug: s.payload.country.toLowerCase(),
    geohash: "",
    searchTokens: [],
    createdAt: s.createdAt,
    updatedAt: s.createdAt,
  };
}

export function MosqueViewDialog({
  open,
  onOpenChange,
  source,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: MosqueViewSource | null;
}) {
  const router = useRouter();
  const t = useTranslations("mosquesAdmin.viewDialog");
  const tToast = useTranslations("mosquesAdmin.actions");
  const tCommon = useTranslations("common");
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (!next) {
      setRejecting(false);
      setRejectReason("");
    }
    onOpenChange(next);
  }

  if (!source) return null;
  const mosque =
    source.kind === "mosque" ? source.data : submissionToMosque(source.data);

  function callAction(
    fn: () => Promise<{ ok: boolean; error?: string }>,
    onOk: () => void,
  ) {
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        toast.error(`${tToast("errorGeneric")} (${res.error ?? "unknown"})`);
        return;
      }
      onOk();
      router.refresh();
      handleOpenChange(false);
    });
  }

  function handleApprove() {
    if (source?.kind !== "submission") return;
    const id = source.data.id;
    callAction(
      () => promoteSubmission(id),
      () => toast.success(tToast("promotedToast")),
    );
  }

  function handleReject() {
    if (source?.kind !== "submission") return;
    const id = source.data.id;
    callAction(
      () => rejectSubmission(id, rejectReason),
      () => toast.success(tToast("rejectedToast")),
    );
  }

  return (
    <EditorDialog open={open} onOpenChange={handleOpenChange}>
      <EditorDialogContent>
        {source.kind === "submission" && (
          <div className="border-b border-border bg-warning/5 px-5 py-3 pe-12">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <Badge variant="warning">{t("badgeSubmission")}</Badge>
              <span className="text-muted-foreground">
                {t("submittedMeta", {
                  who:
                    source.data.submittedBy?.email
                    ?? source.data.submittedBy?.uid
                    ?? t("anonymous"),
                  when: formatRelative(source.data.createdAt),
                })}
              </span>
            </div>
          </div>
        )}

        <EditorDialogBody className="p-0">
          <div className="px-5 py-6">
            <MosqueProfile mosque={mosque} />
          </div>
        </EditorDialogBody>

        <EditorDialogFooter>
          {source.kind === "submission" ? (
            rejecting ? (
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="mosque-view-reject-reason">{t("rejectReasonLabel")}</Label>
                  <Input
                    id="mosque-view-reject-reason"
                    autoFocus
                    placeholder={t("rejectReasonPlaceholder")}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setRejecting(false);
                      setRejectReason("");
                    }}
                  >
                    {tCommon("cancel")}
                  </Button>
                  <Button
                    variant="danger"
                    disabled={!rejectReason.trim()}
                    onClick={handleReject}
                  >
                    {t("rejectConfirm")}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setRejecting(true)}>
                  <XCircle /> {t("reject")}
                </Button>
                <Button onClick={handleApprove}>
                  <CheckCircle2 /> {t("approve")}
                </Button>
              </>
            )
          ) : (
            <>
              <Button variant="secondary" onClick={() => handleOpenChange(false)}>
                {tCommon("close")}
              </Button>
              <Button asChild>
                <Link href={`/admin/mosques/${source.data.slug}/edit`}>
                  <Edit /> {t("edit")}
                </Link>
              </Button>
            </>
          )}
        </EditorDialogFooter>
      </EditorDialogContent>
    </EditorDialog>
  );
}
