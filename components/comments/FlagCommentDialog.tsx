"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { flagCommentAction } from "@/app/[locale]/(site)/comments-actions";

interface Props {
  commentId: string | null;
  onClose: () => void;
  onFlagged: (autoHidden: boolean) => void;
}

export function FlagCommentDialog({ commentId, onClose, onFlagged }: Props) {
  const t = useTranslations("comments.flag");
  const tCommon = useTranslations("common");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function handleClose() {
    if (pending) return;
    setReason("");
    onClose();
  }

  function submit() {
    if (!commentId) return;
    startTransition(async () => {
      const r = await flagCommentAction({ commentId, reason });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(t("submittedToast"));
      onFlagged(r.autoHidden);
      setReason("");
      onClose();
    });
  }

  return (
    <Dialog open={!!commentId} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <label className="text-sm font-medium" htmlFor="flag-reason">
          {t("reasonLabel")}
        </label>
        <textarea
          id="flag-reason"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="comment-textarea"
          placeholder={t("reasonPlaceholder")}
          disabled={pending}
          maxLength={500}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={pending}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={submit} disabled={pending}>
            {t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
