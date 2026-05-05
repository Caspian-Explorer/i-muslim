"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Loader2, Pencil, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountryCombobox } from "@/components/common/CountryCombobox";
import { LanguageCombobox } from "@/components/common/LanguageCombobox";
import { MosqueMap } from "@/components/mosque/MosqueMap";
import { getCallingCode } from "@/lib/countries/calling-codes";
import { suggestCountryForTimezone } from "@/lib/countries/tz-to-country";
import { cn } from "@/lib/utils";
import { DENOMINATIONS } from "@/lib/mosques/constants";
import { createMosque, type MosqueInput } from "@/app/[locale]/(admin)/admin/mosques/actions";
import type { Denomination, MosqueStatus } from "@/types/mosque";

const PUBLIC_STEPS = ["basics", "location", "contact", "review"] as const;
const ADMIN_STEPS = ["basics", "location", "contact", "admin", "review"] as const;
type Step = (typeof ADMIN_STEPS)[number];

const ADMIN_STATUSES: MosqueStatus[] = ["draft", "pending_review", "published", "suspended"];

type GeocodeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; lat: number; lng: number }
  | { status: "fail" };

interface FormState {
  nameEn: string;
  nameAr: string;
  description: string;
  denomination: Denomination;
  addressLine1: string;
  city: string;
  region: string;
  countryCode: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  languages: string[];
  adminStatus: MosqueStatus;
  // honeypot
  website_url_secondary: string;
}

const empty: FormState = {
  nameEn: "",
  nameAr: "",
  description: "",
  denomination: "unspecified",
  addressLine1: "",
  city: "",
  region: "",
  countryCode: "",
  postalCode: "",
  phone: "",
  email: "",
  website: "",
  languages: [],
  adminStatus: "draft",
  website_url_secondary: "",
};

interface Props {
  /** The signed-in user's email — submission is auth-gated server-side; this is informational only. */
  userEmail: string;
  /** When true, skip honeypot/Turnstile and submit via the admin server action. */
  adminMode?: boolean;
  onAdminSaved?: (result: { slug: string }) => void;
  onAdminCancel?: () => void;
}

export function SubmitMosqueForm({
  userEmail,
  adminMode = false,
  onAdminSaved,
  onAdminCancel,
}: Props) {
  void userEmail; // referenced via session server-side; prop kept for symmetry with other submit forms
  const t = useTranslations("mosques.submit");
  const tDenominations = useTranslations("mosques.denominations");
  const tQuick = useTranslations("quickCreate");
  const tStatuses = useTranslations("mosquesAdmin.statuses");

  const STEPS: readonly Step[] = adminMode ? ADMIN_STEPS : PUBLIC_STEPS;

  const [state, setState] = useState<FormState>(empty);
  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [geocode, setGeocode] = useState<GeocodeState>({ status: "idle" });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((prev) => {
      if (prev.countryCode) return prev;
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const detected = suggestCountryForTimezone(tz);
        if (!detected) return prev;
        return { ...prev, countryCode: detected };
      } catch {
        return prev;
      }
    });
  }, []);

  const reviewAddress =
    state.addressLine1.trim() && state.city.trim() && state.countryCode
      ? [state.addressLine1, state.city, state.region, state.postalCode, state.countryCode]
          .filter(Boolean)
          .join(", ")
      : "";

  useEffect(() => {
    if (STEPS[stepIdx] !== "review" || !reviewAddress) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGeocode({ status: "loading" });
    // Nominatim (the OSM-backed geocoder behind /api/businesses/geocode) often
    // chokes on verbose multi-comma queries, especially for non-Anglo addresses.
    // Try progressively simpler queries before giving up so the review map is
    // useful even when the full address doesn't match an OSM feature.
    const queries = Array.from(
      new Set(
        [
          reviewAddress,
          [state.addressLine1, state.city, state.countryCode].filter(Boolean).join(", "),
          [state.city, state.region, state.countryCode].filter(Boolean).join(", "),
          [state.city, state.countryCode].filter(Boolean).join(", "),
        ].filter((q) => q.trim().length > 0),
      ),
    );
    (async () => {
      for (const q of queries) {
        if (cancelled) return;
        try {
          const res = await fetch(`/api/businesses/geocode?q=${encodeURIComponent(q)}`);
          const data = (await res.json().catch(() => ({}))) as {
            ok?: boolean;
            lat?: number;
            lng?: number;
          };
          if (cancelled) return;
          if (res.ok && data.ok && typeof data.lat === "number" && typeof data.lng === "number") {
            setGeocode({ status: "ok", lat: data.lat, lng: data.lng });
            return;
          }
        } catch {
          // try the next, less specific query
        }
      }
      if (!cancelled) setGeocode({ status: "fail" });
    })();
    return () => {
      cancelled = true;
    };
  }, [
    stepIdx,
    reviewAddress,
    STEPS,
    state.addressLine1,
    state.city,
    state.region,
    state.countryCode,
  ]);

  function validateStep(step: Step): Record<string, string> {
    const next: Record<string, string> = {};
    if (step === "basics") {
      if (state.nameEn.trim().length < 2) next.nameEn = t("validation.nameRequired");
      if (state.description.trim().length > 500) next.description = t("validation.descriptionMax");
    }
    if (step === "location") {
      if (state.addressLine1.trim().length < 2) next.addressLine1 = t("validation.addressRequired");
      if (!state.city.trim()) next.city = t("validation.cityRequired");
      if (!/^[A-Za-z]{2}$/.test(state.countryCode.trim())) next.country = t("validation.countryRequired");
    }
    if (step === "contact") {
      const phone = state.phone.trim();
      if (phone && !/^[+]?[\d\s()-]{7,}$/.test(phone)) {
        next.phone = t("validation.phoneInvalid");
      }
      const email = state.email.trim();
      if (email && !/^.+@.+\..+$/.test(email)) {
        next.email = t("validation.emailInvalid");
      }
      const website = state.website.trim();
      if (website) {
        const candidate = /^https?:\/\//i.test(website) ? website : `https://${website}`;
        try {
          new URL(candidate);
        } catch {
          next.website = t("validation.websiteInvalid");
        }
      }
    }
    // No validation for "admin" — status select has a default.
    return next;
  }

  function focusFirstError(errs: Record<string, string>) {
    const FIELD_TO_ID: Record<string, string> = {
      nameEn: "sub-name-en",
      description: "sub-desc",
      addressLine1: "sub-address",
      city: "sub-city",
      country: "sub-country",
      phone: "sub-phone",
      email: "sub-email",
      website: "sub-website",
    };
    const first = Object.keys(errs)[0];
    if (!first) return;
    const id = FIELD_TO_ID[first];
    if (!id) return;
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el && typeof (el as HTMLElement).focus === "function") {
        (el as HTMLElement).focus();
      }
    });
  }

  function handleNext() {
    const step = STEPS[stepIdx];
    if (!step) return;
    const stepErrors = validateStep(step);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) {
      toast.error(t("validation.fixStep"));
      focusFirstError(stepErrors);
      return;
    }
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
  }

  function handleBack() {
    setErrors({});
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  }

  function jumpToStep(target: number) {
    setErrors({});
    setStepIdx(target);
  }

  function normalizedWebsite(): string {
    const trimmed = state.website.trim();
    if (!trimmed) return "";
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }

  function buildAdminInput(): MosqueInput {
    const description = state.description.trim();
    const nameAr = state.nameAr.trim();
    const website = normalizedWebsite();
    return {
      name: {
        en: state.nameEn.trim(),
        ...(nameAr ? { ar: nameAr } : {}),
      },
      denomination: state.denomination,
      ...(description.length >= 2 ? { description: { en: description } } : {}),
      address: {
        line1: state.addressLine1.trim(),
        ...(state.postalCode.trim() ? { postalCode: state.postalCode.trim() } : {}),
      },
      city: state.city.trim(),
      ...(state.region.trim() ? { region: state.region.trim() } : {}),
      country: state.countryCode.trim().toUpperCase(),
      // Coordinates and timezone are filled in on the edit page after creation —
      // matches the public submit route's defaults (route.ts uses lat/lng = 0, tz = "UTC").
      location: { lat: 0, lng: 0 },
      timezone: "UTC",
      contact: {
        phone: state.phone.trim() || undefined,
        email: state.email.trim() || undefined,
        website: website || undefined,
      },
      languages: state.languages,
      status: state.adminStatus,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    for (let i = 0; i < STEPS.length; i += 1) {
      const step = STEPS[i]!;
      const stepErrors = validateStep(step);
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        setStepIdx(i);
        toast.error(t("validation.fixStep"));
        focusFirstError(stepErrors);
        return;
      }
    }
    setSubmitting(true);
    try {
      if (adminMode) {
        let result: Awaited<ReturnType<typeof createMosque>>;
        try {
          result = await createMosque(buildAdminInput());
        } catch (err) {
          // Server actions surface unhandled exceptions as thrown errors on the
          // client; without this catch the user just sees the spinner stop.
          toast.error(err instanceof Error ? err.message : t("errorGeneric"));
          return;
        }
        if (!result.ok) {
          toast.error(result.error ?? t("errorGeneric"));
          return;
        }
        toast.success(t("success"));
        toast.message(tQuick("adminFields.coordsMissingHint"));
        onAdminSaved?.({ slug: result.slug ?? "" });
        return;
      }

      const res = await fetch("/api/mosques/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameEn: state.nameEn,
          nameAr: state.nameAr,
          addressLine1: state.addressLine1,
          city: state.city,
          country: state.countryCode,
          denomination: state.denomination,
          phone: state.phone,
          website: normalizedWebsite(),
          email: state.email,
          description: state.description,
          languages: state.languages,
          website_url_secondary: state.website_url_secondary,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.status === 429) {
        toast.error(t("errorRate"));
        return;
      }
      if (res.status === 403 && data.error === "turnstile") {
        toast.error(t("errorTurnstile"));
        return;
      }
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? t("errorGeneric"));
        return;
      }
      toast.success(t("success"));
      setState(empty);
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (done && !adminMode) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-base font-medium text-foreground">{t("success")}</p>
      </div>
    );
  }

  const step = STEPS[stepIdx]!;
  const isLast = stepIdx === STEPS.length - 1;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("space-y-6", adminMode && "flex h-full flex-col space-y-0")}
    >
      {!adminMode && (
        <input
          type="text"
          name="website_url_secondary"
          autoComplete="off"
          tabIndex={-1}
          className="hidden"
          value={state.website_url_secondary}
          onChange={(e) => setState((s) => ({ ...s, website_url_secondary: e.target.value }))}
        />
      )}

      <div className={cn(adminMode && "border-b border-border px-4 pb-3 pt-4 md:px-6")}>
        <ol className="flex items-center gap-2 text-xs">
          {STEPS.map((s, i) => {
            const active = i === stepIdx;
            const completed = i < stepIdx;
            const stepLabel = s === "admin" ? tQuick("steps.admin") : t(`steps.${s}`);
            return (
              <li key={s} className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => jumpToStep(i)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 transition ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : completed
                        ? "border border-primary text-primary hover:bg-primary/10"
                        : "border border-input text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span
                    className={`flex size-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                      active
                        ? "bg-primary-foreground text-primary"
                        : completed
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {stepLabel}
                </button>
                {i < STEPS.length - 1 && (
                  <span aria-hidden className="text-muted-foreground">›</span>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className={cn(adminMode && "flex-1 min-h-0 space-y-6 overflow-y-auto px-4 py-4 md:px-6")}>
        {step === "basics" && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="sub-name-en">{t("fields.nameEn")}</Label>
              <Input
                id="sub-name-en"
                value={state.nameEn}
                onChange={(e) => setState((s) => ({ ...s, nameEn: e.target.value }))}
              />
              {errors.nameEn && <p className="text-xs text-danger">{errors.nameEn}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sub-name-ar">{t("fields.nameAr")}</Label>
              <Input
                id="sub-name-ar"
                dir="rtl"
                lang="ar"
                className="font-arabic"
                value={state.nameAr}
                onChange={(e) => setState((s) => ({ ...s, nameAr: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sub-denom">{t("fields.denomination")}</Label>
              <select
                id="sub-denom"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={state.denomination}
                onChange={(e) => setState((s) => ({ ...s, denomination: e.target.value as Denomination }))}
              >
                {DENOMINATIONS.map((d) => (
                  <option key={d} value={d}>
                    {tDenominations(d)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sub-desc">{t("fields.description")}</Label>
              <textarea
                id="sub-desc"
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={state.description}
                onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
                maxLength={500}
              />
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-danger">{errors.description ?? ""}</p>
                {(() => {
                  const len = state.description.length;
                  const tone =
                    len > 500
                      ? "text-danger"
                      : len >= 450
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground";
                  return <span className={`shrink-0 text-xs tabular-nums ${tone}`}>{len} / 500</span>;
                })()}
              </div>
            </div>
          </div>
        )}

        {step === "location" && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="sub-address">{t("fields.addressLine1")}</Label>
              <Input
                id="sub-address"
                value={state.addressLine1}
                onChange={(e) => setState((s) => ({ ...s, addressLine1: e.target.value }))}
              />
              {errors.addressLine1 && <p className="text-xs text-danger">{errors.addressLine1}</p>}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sub-city">{t("fields.city")}</Label>
                <Input
                  id="sub-city"
                  value={state.city}
                  onChange={(e) => setState((s) => ({ ...s, city: e.target.value }))}
                />
                {errors.city && <p className="text-xs text-danger">{errors.city}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sub-region">{t("fields.region")}</Label>
                <Input
                  id="sub-region"
                  value={state.region}
                  onChange={(e) => setState((s) => ({ ...s, region: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sub-country">{t("fields.country")}</Label>
                <CountryCombobox
                  id="sub-country"
                  value={state.countryCode}
                  onChange={(code) => setState((s) => ({ ...s, countryCode: code }))}
                />
                {errors.country && <p className="text-xs text-danger">{errors.country}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sub-postal">{t("fields.postalCode")}</Label>
                <Input
                  id="sub-postal"
                  value={state.postalCode}
                  onChange={(e) => setState((s) => ({ ...s, postalCode: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}

        {step === "contact" && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sub-phone">{t("fields.phone")}</Label>
                <Input
                  id="sub-phone"
                  value={state.phone}
                  placeholder={(() => {
                    const code = getCallingCode(state.countryCode);
                    return code ? `+${code} …` : undefined;
                  })()}
                  onChange={(e) => setState((s) => ({ ...s, phone: e.target.value }))}
                />
                {errors.phone && <p className="text-xs text-danger">{errors.phone}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sub-email">{t("fields.email")}</Label>
                <Input
                  id="sub-email"
                  type="email"
                  value={state.email}
                  onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
                />
                {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sub-website">{t("fields.website")}</Label>
              <Input
                id="sub-website"
                type="url"
                placeholder="https://"
                value={state.website}
                onChange={(e) => setState((s) => ({ ...s, website: e.target.value }))}
              />
              {errors.website && <p className="text-xs text-danger">{errors.website}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sub-languages">{t("fields.languages")}</Label>
              <LanguageCombobox
                id="sub-languages"
                multiple
                value={state.languages}
                onChange={(codes) => setState((s) => ({ ...s, languages: codes }))}
              />
            </div>
          </div>
        )}

        {step === "admin" && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="sub-admin-status">{tQuick("adminFields.status")}</Label>
              <select
                id="sub-admin-status"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={state.adminStatus}
                onChange={(e) =>
                  setState((s) => ({ ...s, adminStatus: e.target.value as MosqueStatus }))
                }
              >
                {ADMIN_STATUSES.map((opt) => (
                  <option key={opt} value={opt}>
                    {tStatuses(opt)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {tQuick("adminFields.statusHintMosque")}
              </p>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-5">
            <ReviewSection
              title={t("steps.basics")}
              onEdit={() => jumpToStep(STEPS.indexOf("basics"))}
              editLabel={t("review.editSection", { section: t("steps.basics") })}
              rows={[
                { label: t("fields.nameEn"), value: state.nameEn },
                ...(state.nameAr ? [{ label: t("fields.nameAr"), value: state.nameAr }] : []),
                { label: t("fields.denomination"), value: tDenominations(state.denomination) },
                ...(state.description ? [{ label: t("fields.description"), value: state.description }] : []),
              ]}
            />

            <ReviewSection
              title={t("steps.location")}
              onEdit={() => jumpToStep(STEPS.indexOf("location"))}
              editLabel={t("review.editSection", { section: t("steps.location") })}
              rows={[
                {
                  label: t("fields.addressLine1"),
                  value: [state.addressLine1, state.city, state.region, state.postalCode, state.countryCode]
                    .filter(Boolean)
                    .join(", "),
                },
              ]}
            />

            <ReviewSection
              title={t("steps.contact")}
              onEdit={() => jumpToStep(STEPS.indexOf("contact"))}
              editLabel={t("review.editSection", { section: t("steps.contact") })}
              rows={[
                ...(state.phone ? [{ label: t("fields.phone"), value: state.phone }] : []),
                ...(state.email ? [{ label: t("fields.email"), value: state.email }] : []),
                ...(state.website ? [{ label: t("fields.website"), value: state.website }] : []),
                ...(state.languages.length > 0
                  ? [{ label: t("fields.languages"), value: state.languages.join(", ") }]
                  : []),
              ]}
            />

            {geocode.status === "loading" && (
              <div className="h-[240px] w-full animate-pulse rounded-md bg-muted" aria-hidden />
            )}
            {geocode.status === "ok" && (
              <MosqueMap
                lat={geocode.lat}
                lng={geocode.lng}
                className="h-[240px] w-full overflow-hidden rounded-md"
              />
            )}
            {geocode.status === "fail" && (
              <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                {t("review.geocodeFailed")}
              </p>
            )}

            {adminMode && (
              <ReviewSection
                title={tQuick("steps.admin")}
                onEdit={() => jumpToStep(STEPS.indexOf("admin"))}
                editLabel={t("review.editSection", { section: tQuick("steps.admin") })}
                rows={[{ label: tQuick("adminFields.status"), value: tStatuses(state.adminStatus) }]}
              />
            )}
          </div>
        )}
      </div>

      <div
        className={cn(
          "flex flex-wrap items-center gap-2 border-t border-border pt-4",
          adminMode && "border-t border-border bg-card px-4 pb-4 pt-3 md:px-6",
        )}
      >
        {adminMode && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onAdminCancel}
            className="text-muted-foreground"
            disabled={submitting}
          >
            {tQuick("cancel")}
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {stepIdx > 0 && (
            <Button type="button" variant="secondary" onClick={handleBack} disabled={submitting}>
              <ArrowLeft /> {t("actions.back")}
            </Button>
          )}
          {!isLast && (
            <Button type="button" onClick={handleNext}>
              {t("actions.next")} <ArrowRight />
            </Button>
          )}
          {isLast && (
            <Button type="submit" disabled={submitting} aria-busy={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <Send />}
              {submitting
                ? t("actions.submitting")
                : adminMode
                  ? tQuick("create")
                  : t("actions.submit")}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

interface ReviewSectionProps {
  title: string;
  onEdit: () => void;
  editLabel: string;
  rows: Array<{ label: string; value: string }>;
}

function ReviewSection({ title, onEdit, editLabel, rows }: ReviewSectionProps) {
  return (
    <section className="rounded-md border border-border bg-card p-4">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          <Pencil /> {editLabel}
        </Button>
      </header>
      <dl className="grid gap-1 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[8rem_1fr] gap-2">
            <dt className="text-xs text-muted-foreground">{row.label}</dt>
            <dd className="whitespace-pre-line break-words">{row.value || "—"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
