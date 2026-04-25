"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import type { BusinessReportReason } from "@/types/business";

const REASONS: BusinessReportReason[] = [
  "not_halal", "closed", "wrong_info", "offensive", "duplicate", "other",
];

interface Props {
  businessId: string;
  businessName: string;
}

export function ReportListingDialog({ businessId, businessName }: Props) {
  const t = useTranslations("businesses.report");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<BusinessReportReason>("wrong_info");
  const [note, setNote] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/businesses/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessId,
          reason,
          note: note.trim() || undefined,
          reporterEmail: email.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error || t("errorGeneric"));
        return;
      }
      toast.success(t("submitted"));
      setOpen(false);
      setNote("");
      setEmail("");
      setReason("wrong_info");
    } catch {
      toast.error(t("errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Flag className="size-4" /> {t("title")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")} <span className="font-medium">{businessName}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="report-reason">{t("reasonLabel")}</Label>
            <select
              id="report-reason"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value as BusinessReportReason)}
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>{t(`reasons.${r}`)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-note">{t("noteLabel")}</Label>
            <textarea
              id="report-note"
              rows={3}
              maxLength={1000}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-email">{t("emailLabel")}</Label>
            <Input
              id="report-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={submitting} aria-busy={submitting}>
              {submitting ? t("submitting") : t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
