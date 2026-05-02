"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EventCategory, EventLocationMode } from "@/types/admin";

const CATEGORIES: EventCategory[] = [
  "prayer",
  "lecture",
  "iftar",
  "janazah",
  "class",
  "fundraiser",
  "community",
  "other",
];

const LOCATION_MODES: EventLocationMode[] = ["in-person", "online", "hybrid"];

interface FormState {
  title: string;
  description: string;
  category: EventCategory;
  startsAt: string;
  endsAt: string;
  timezone: string;
  locationMode: EventLocationMode;
  venue: string;
  address: string;
  url: string;
  organizerName: string;
  organizerContact: string;
  submitterEmail: string;
  website_url_secondary: string;
}

function makeEmpty(email: string): FormState {
  const tz =
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
  return {
    title: "",
    description: "",
    category: "community",
    startsAt: "",
    endsAt: "",
    timezone: tz || "UTC",
    locationMode: "in-person",
    venue: "",
    address: "",
    url: "",
    organizerName: "",
    organizerContact: "",
    submitterEmail: email,
    website_url_secondary: "",
  };
}

export function SubmitEventForm({ userEmail }: { userEmail: string }) {
  const t = useTranslations("eventsPublic.submit");
  const tCategories = useTranslations("events.categories");
  const [state, setState] = useState<FormState>(() => makeEmpty(userEmail));
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (state.title.trim().length < 2) next.title = t("validation.titleRequired");
    if (!state.startsAt) next.startsAt = t("validation.startRequired");
    if (
      state.endsAt &&
      state.startsAt &&
      new Date(state.endsAt).getTime() < new Date(state.startsAt).getTime()
    ) {
      next.endsAt = t("validation.endsBeforeStart");
    }
    if (!state.organizerName.trim()) next.organizerName = t("validation.organizerRequired");
    if (!/^.+@.+\..+$/.test(state.submitterEmail.trim()))
      next.submitterEmail = t("validation.submitterEmailRequired");
    if (state.locationMode !== "online" && !state.venue.trim() && !state.address.trim())
      next.venue = t("validation.venueRequired");
    if (state.locationMode !== "in-person" && !state.url.trim())
      next.url = t("validation.urlRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        title: state.title,
        description: state.description || undefined,
        category: state.category,
        startsAt: new Date(state.startsAt).toISOString(),
        endsAt: state.endsAt ? new Date(state.endsAt).toISOString() : undefined,
        timezone: state.timezone,
        location: {
          mode: state.locationMode,
          venue: state.venue || undefined,
          address: state.address || undefined,
          url: state.url || undefined,
        },
        organizer: {
          name: state.organizerName,
          contact: state.organizerContact || undefined,
        },
        submitterEmail: state.submitterEmail,
        website_url_secondary: state.website_url_secondary,
      };

      const res = await fetch("/api/events/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.status === 401) {
        toast.error(t("errorAuth"));
        return;
      }
      if (res.status === 429) {
        toast.error(t("errorRate"));
        return;
      }
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? t("errorGeneric"));
        return;
      }
      toast.success(t("success"));
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-base font-medium text-foreground">{t("success")}</p>
      </div>
    );
  }

  const showVenue = state.locationMode !== "online";
  const showUrl = state.locationMode !== "in-person";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input
        type="text"
        name="website_url_secondary"
        autoComplete="off"
        tabIndex={-1}
        className="hidden"
        value={state.website_url_secondary}
        onChange={(e) => setState((s) => ({ ...s, website_url_secondary: e.target.value }))}
      />

      <div className="space-y-1.5">
        <Label htmlFor="evt-title">{t("fields.title")}</Label>
        <Input
          id="evt-title"
          value={state.title}
          onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))}
        />
        {errors.title && <p className="text-xs text-danger">{errors.title}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="evt-description">{t("fields.description")}</Label>
        <textarea
          id="evt-description"
          className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={state.description}
          onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="evt-category">{t("fields.category")}</Label>
        <select
          id="evt-category"
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={state.category}
          onChange={(e) => setState((s) => ({ ...s, category: e.target.value as EventCategory }))}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {tCategories(c)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="evt-starts">{t("fields.startsAt")}</Label>
          <Input
            id="evt-starts"
            type="datetime-local"
            value={state.startsAt}
            onChange={(e) => setState((s) => ({ ...s, startsAt: e.target.value }))}
          />
          {errors.startsAt && <p className="text-xs text-danger">{errors.startsAt}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="evt-ends">{t("fields.endsAt")}</Label>
          <Input
            id="evt-ends"
            type="datetime-local"
            value={state.endsAt}
            onChange={(e) => setState((s) => ({ ...s, endsAt: e.target.value }))}
          />
          {errors.endsAt && <p className="text-xs text-danger">{errors.endsAt}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="evt-timezone">{t("fields.timezone")}</Label>
        <Input
          id="evt-timezone"
          value={state.timezone}
          onChange={(e) => setState((s) => ({ ...s, timezone: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="evt-location-mode">{t("fields.locationMode")}</Label>
        <select
          id="evt-location-mode"
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={state.locationMode}
          onChange={(e) =>
            setState((s) => ({ ...s, locationMode: e.target.value as EventLocationMode }))
          }
        >
          {LOCATION_MODES.map((m) => (
            <option key={m} value={m}>
              {t(`locationModes.${m}`)}
            </option>
          ))}
        </select>
      </div>

      {showVenue && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="evt-venue">{t("fields.venue")}</Label>
            <Input
              id="evt-venue"
              value={state.venue}
              onChange={(e) => setState((s) => ({ ...s, venue: e.target.value }))}
            />
            {errors.venue && <p className="text-xs text-danger">{errors.venue}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="evt-address">{t("fields.address")}</Label>
            <Input
              id="evt-address"
              value={state.address}
              onChange={(e) => setState((s) => ({ ...s, address: e.target.value }))}
            />
          </div>
        </div>
      )}

      {showUrl && (
        <div className="space-y-1.5">
          <Label htmlFor="evt-url">{t("fields.url")}</Label>
          <Input
            id="evt-url"
            type="url"
            value={state.url}
            onChange={(e) => setState((s) => ({ ...s, url: e.target.value }))}
          />
          {errors.url && <p className="text-xs text-danger">{errors.url}</p>}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="evt-organizer">{t("fields.organizerName")}</Label>
          <Input
            id="evt-organizer"
            value={state.organizerName}
            onChange={(e) => setState((s) => ({ ...s, organizerName: e.target.value }))}
          />
          {errors.organizerName && (
            <p className="text-xs text-danger">{errors.organizerName}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="evt-contact">{t("fields.organizerContact")}</Label>
          <Input
            id="evt-contact"
            value={state.organizerContact}
            onChange={(e) => setState((s) => ({ ...s, organizerContact: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="evt-submitter">{t("fields.submitterEmail")}</Label>
        <Input
          id="evt-submitter"
          type="email"
          value={state.submitterEmail}
          onChange={(e) => setState((s) => ({ ...s, submitterEmail: e.target.value }))}
        />
        {errors.submitterEmail && (
          <p className="text-xs text-danger">{errors.submitterEmail}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={submitting} aria-busy={submitting}>
          {submitting ? <Loader2 className="animate-spin" /> : <Send />}
          {submitting ? t("actions.submitting") : t("actions.submit")}
        </Button>
      </div>
    </form>
  );
}
