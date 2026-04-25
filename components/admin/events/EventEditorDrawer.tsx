"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/sonner";
import {
  createEventAction,
  updateEventAction,
  type EventInput,
} from "@/lib/admin/actions/events";
import { buildRRule } from "@/lib/admin/recurrence";
import type {
  AdminEvent,
  EventCategory,
  EventLocationMode,
  EventStatus,
  PrayerAnchor,
} from "@/types/admin";

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
const STATUSES: EventStatus[] = ["draft", "published", "cancelled"];
const LOCATION_MODES: EventLocationMode[] = ["in-person", "online", "hybrid"];
const PRAYER_ANCHORS: PrayerAnchor[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

type RecurrenceMode = "none" | "weekly" | "daily" | "monthly" | "hijri-anchor";

type FormValues = {
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  category: EventCategory;
  status: EventStatus;
  startsAt: string;
  endsAt: string;
  timezone: string;
  locationMode: EventLocationMode;
  venue: string;
  address: string;
  url: string;
  organizerName: string;
  organizerContact: string;
  capacity: string;
  recurrenceMode: RecurrenceMode;
  recurrenceCount: string;
  hijriMonth: string;
  hijriDay: string;
  prayerAnchorEnabled: boolean;
  prayerAnchor: PrayerAnchor;
  prayerOffsetMinutes: string;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: AdminEvent | null;
  canPersist: boolean;
  onSaved: (saved: AdminEvent, mode: "create" | "update") => void;
}

function isoToLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

function detectRecurrenceMode(event?: AdminEvent | null): RecurrenceMode {
  if (!event) return "none";
  if (event.hijriAnchor) return "hijri-anchor";
  if (event.recurrence?.includes("FREQ=WEEKLY")) return "weekly";
  if (event.recurrence?.includes("FREQ=DAILY")) return "daily";
  if (event.recurrence?.includes("FREQ=MONTHLY")) return "monthly";
  return "none";
}

function detectRecurrenceCount(rrule?: string): string {
  if (!rrule) return "";
  const match = /COUNT=(\d+)/.exec(rrule);
  return match ? match[1]! : "";
}

function defaultsFromEvent(event?: AdminEvent | null): FormValues {
  const tz =
    event?.timezone ??
    (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC");
  return {
    titleEn: event?.title.en ?? "",
    titleAr: event?.title.ar ?? "",
    descriptionEn: event?.description?.en ?? "",
    descriptionAr: event?.description?.ar ?? "",
    category: event?.category ?? "lecture",
    status: event?.status ?? "draft",
    startsAt: isoToLocalInput(event?.startsAt),
    endsAt: isoToLocalInput(event?.endsAt),
    timezone: tz,
    locationMode: event?.location.mode ?? "in-person",
    venue: event?.location.venue ?? "",
    address: event?.location.address ?? "",
    url: event?.location.url ?? "",
    organizerName: event?.organizer.name ?? "",
    organizerContact: event?.organizer.contact ?? "",
    capacity: event?.capacity != null ? String(event.capacity) : "",
    recurrenceMode: detectRecurrenceMode(event),
    recurrenceCount: detectRecurrenceCount(event?.recurrence),
    hijriMonth: event?.hijriAnchor?.monthIndex != null ? String(event.hijriAnchor.monthIndex) : "9",
    hijriDay: event?.hijriAnchor?.day != null ? String(event.hijriAnchor.day) : "1",
    prayerAnchorEnabled: Boolean(event?.startAnchor),
    prayerAnchor: event?.startAnchor?.prayer ?? "maghrib",
    prayerOffsetMinutes:
      event?.startAnchor?.offsetMinutes != null
        ? String(event.startAnchor.offsetMinutes)
        : "0",
  };
}

export function EventEditorDrawer({
  open,
  onOpenChange,
  event,
  canPersist,
  onSaved,
}: Props) {
  const t = useTranslations("events.editor");
  const tCategories = useTranslations("events.categories");
  const tStatuses = useTranslations("events.statuses");
  const tLocations = useTranslations("events.locationModes");
  const tRecurrence = useTranslations("events.recurrence");
  const tPrayerNames = useTranslations("prayerTimes");
  const tHijriMonths = useTranslations("hijri.months");
  const tCommon = useTranslations("common");
  const [submitting, setSubmitting] = useState(false);
  const editing = Boolean(event);

  const schema = useMemo(
    () =>
      z
        .object({
          titleEn: z.string().min(2, t("errorTitle")),
          titleAr: z.string(),
          descriptionEn: z.string(),
          descriptionAr: z.string(),
          category: z.enum(CATEGORIES as [EventCategory, ...EventCategory[]]),
          status: z.enum(STATUSES as [EventStatus, ...EventStatus[]]),
          startsAt: z.string().min(1, t("errorStartsAt")),
          endsAt: z.string(),
          timezone: z.string().min(1, t("errorTimezone")),
          locationMode: z.enum(
            LOCATION_MODES as [EventLocationMode, ...EventLocationMode[]],
          ),
          venue: z.string(),
          address: z.string(),
          url: z
            .string()
            .refine((v) => !v || /^https?:\/\//i.test(v), { message: t("errorUrl") }),
          organizerName: z.string().min(1, t("errorOrganizer")),
          organizerContact: z.string(),
          capacity: z
            .string()
            .refine((v) => !v || (/^\d+$/.test(v) && Number(v) >= 0), {
              message: t("errorCapacity"),
            }),
          recurrenceMode: z.enum(["none", "weekly", "daily", "monthly", "hijri-anchor"]),
          recurrenceCount: z
            .string()
            .refine((v) => !v || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 999), {
              message: t("errorRecurrenceCount"),
            }),
          hijriMonth: z.string(),
          hijriDay: z.string(),
          prayerAnchorEnabled: z.boolean(),
          prayerAnchor: z.enum(["fajr", "dhuhr", "asr", "maghrib", "isha"]),
          prayerOffsetMinutes: z
            .string()
            .refine((v) => !v || /^-?\d+$/.test(v), {
              message: t("errorOffsetMinutes"),
            }),
        })
        .refine(
          (v) => !v.endsAt || new Date(v.endsAt).getTime() >= new Date(v.startsAt).getTime(),
          { message: t("errorEndsAfterStart"), path: ["endsAt"] },
        )
        .refine(
          (v) => v.locationMode === "online" || Boolean(v.venue.trim()),
          { message: t("errorVenue"), path: ["venue"] },
        )
        .refine(
          (v) => v.locationMode === "in-person" || Boolean(v.url.trim()),
          { message: t("errorMeetingUrl"), path: ["url"] },
        ),
    [t],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultsFromEvent(event),
  });

  useEffect(() => {
    if (open) reset(defaultsFromEvent(event));
  }, [open, event, reset]);

  const locationMode = watch("locationMode");
  const recurrenceMode = watch("recurrenceMode");
  const prayerAnchorEnabled = watch("prayerAnchorEnabled");

  async function onSubmit(values: FormValues) {
    if (!canPersist) {
      toast.error(t("noPersistToast"));
      return;
    }

    const startsAtIso = localInputToIso(values.startsAt);
    const startsAtDate = new Date(startsAtIso);

    let recurrence: string | undefined;
    let hijriAnchor: EventInput["hijriAnchor"];
    if (values.recurrenceMode === "weekly") {
      recurrence = buildRRule(
        "weekly",
        startsAtDate,
        values.recurrenceCount ? Number(values.recurrenceCount) : undefined,
      );
    } else if (values.recurrenceMode === "daily") {
      recurrence = buildRRule(
        "daily",
        startsAtDate,
        values.recurrenceCount ? Number(values.recurrenceCount) : undefined,
      );
    } else if (values.recurrenceMode === "monthly") {
      recurrence = buildRRule(
        "monthly",
        startsAtDate,
        values.recurrenceCount ? Number(values.recurrenceCount) : undefined,
      );
    } else if (values.recurrenceMode === "hijri-anchor") {
      hijriAnchor = {
        monthIndex: Math.min(12, Math.max(1, Number(values.hijriMonth) || 1)),
        day: Math.min(30, Math.max(1, Number(values.hijriDay) || 1)),
        hourLocal: startsAtDate.getHours(),
        minuteLocal: startsAtDate.getMinutes(),
      };
    }

    const startAnchor = values.prayerAnchorEnabled
      ? {
          prayer: values.prayerAnchor,
          offsetMinutes: values.prayerOffsetMinutes ? Number(values.prayerOffsetMinutes) : 0,
        }
      : undefined;

    const input: EventInput = {
      title: {
        en: values.titleEn.trim(),
        ar: values.titleAr.trim() || undefined,
      },
      description:
        values.descriptionEn.trim() || values.descriptionAr.trim()
          ? {
              en: values.descriptionEn.trim() || undefined,
              ar: values.descriptionAr.trim() || undefined,
            }
          : undefined,
      category: values.category,
      status: values.status,
      startsAt: startsAtIso,
      endsAt: values.endsAt ? localInputToIso(values.endsAt) : undefined,
      timezone: values.timezone,
      location: {
        mode: values.locationMode,
        venue: values.venue.trim() || undefined,
        address: values.address.trim() || undefined,
        url: values.url.trim() || undefined,
      },
      organizer: {
        name: values.organizerName.trim(),
        contact: values.organizerContact.trim() || undefined,
      },
      capacity: values.capacity ? Number(values.capacity) : undefined,
      recurrence,
      hijriAnchor,
      startAnchor,
    };

    setSubmitting(true);
    try {
      const result = editing && event
        ? await updateEventAction(event.id, input)
        : await createEventAction(input);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onSaved(result.data, editing ? "update" : "create");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader>
          <SheetTitle>{editing ? t("editTitle") : t("createTitle")}</SheetTitle>
          <SheetDescription>
            {editing ? t("editDescription") : t("createDescription")}
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto p-5 space-y-5"
        >
          <Section title={t("sectionBasics")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("titleEn")} error={errors.titleEn?.message} required>
                <Input id="evt-title-en" autoComplete="off" {...register("titleEn")} />
              </Field>
              <Field label={t("titleAr")} hint={t("titleArHint")}>
                <Input
                  id="evt-title-ar"
                  dir="rtl"
                  lang="ar"
                  autoComplete="off"
                  {...register("titleAr")}
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("category")}>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  {...register("category")}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{tCategories(c)}</option>
                  ))}
                </select>
              </Field>
              <Field label={t("status")}>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  {...register("status")}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{tStatuses(s)}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("descriptionEn")}>
                <textarea
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register("descriptionEn")}
                />
              </Field>
              <Field label={t("descriptionAr")}>
                <textarea
                  rows={3}
                  dir="rtl"
                  lang="ar"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register("descriptionAr")}
                />
              </Field>
            </div>
          </Section>

          <Section title={t("sectionWhen")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("startsAt")} error={errors.startsAt?.message} required>
                <Input id="evt-starts-at" type="datetime-local" {...register("startsAt")} />
              </Field>
              <Field label={t("endsAt")} error={errors.endsAt?.message}>
                <Input id="evt-ends-at" type="datetime-local" {...register("endsAt")} />
              </Field>
            </div>
            <Field label={t("timezone")} error={errors.timezone?.message} hint={t("timezoneHint")}>
              <Input id="evt-tz" autoComplete="off" {...register("timezone")} />
            </Field>

            <Field label={tRecurrence("modeLabel")} hint={tRecurrence("modeHint")}>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                {...register("recurrenceMode")}
              >
                <option value="none">{tRecurrence("none")}</option>
                <option value="weekly">{tRecurrence("weekly")}</option>
                <option value="daily">{tRecurrence("daily")}</option>
                <option value="monthly">{tRecurrence("monthly")}</option>
                <option value="hijri-anchor">{tRecurrence("hijriAnchor")}</option>
              </select>
            </Field>

            {(recurrenceMode === "weekly" ||
              recurrenceMode === "daily" ||
              recurrenceMode === "monthly") && (
              <Field
                label={tRecurrence("countLabel")}
                hint={tRecurrence("countHint")}
                error={errors.recurrenceCount?.message}
              >
                <Input
                  id="evt-rec-count"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={999}
                  placeholder={tRecurrence("countPlaceholder")}
                  {...register("recurrenceCount")}
                />
              </Field>
            )}

            {recurrenceMode === "hijri-anchor" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={tRecurrence("hijriMonthLabel")}>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    {...register("hijriMonth")}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>{tHijriMonths(String(m))}</option>
                    ))}
                  </select>
                </Field>
                <Field label={tRecurrence("hijriDayLabel")}>
                  <Input
                    id="evt-hijri-day"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={30}
                    {...register("hijriDay")}
                  />
                </Field>
              </div>
            )}

            <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3">
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-0.5" {...register("prayerAnchorEnabled")} />
                <span>
                  <span className="font-medium text-foreground">
                    {tRecurrence("prayerAnchorLabel")}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {tRecurrence("prayerAnchorHint")}
                  </span>
                </span>
              </label>
              {prayerAnchorEnabled && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={tRecurrence("prayerLabel")}>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      {...register("prayerAnchor")}
                    >
                      {PRAYER_ANCHORS.map((p) => (
                        <option key={p} value={p}>{tPrayerNames(p)}</option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label={tRecurrence("offsetLabel")}
                    hint={tRecurrence("offsetHint")}
                    error={errors.prayerOffsetMinutes?.message}
                  >
                    <Input
                      id="evt-prayer-offset"
                      type="number"
                      inputMode="numeric"
                      {...register("prayerOffsetMinutes")}
                    />
                  </Field>
                </div>
              )}
            </div>
          </Section>

          <Section title={t("sectionWhere")}>
            <Field label={t("locationMode")}>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                {...register("locationMode")}
              >
                {LOCATION_MODES.map((m) => (
                  <option key={m} value={m}>{tLocations(m)}</option>
                ))}
              </select>
            </Field>
            {locationMode !== "online" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t("venue")} error={errors.venue?.message}>
                  <Input id="evt-venue" autoComplete="off" {...register("venue")} />
                </Field>
                <Field label={t("address")}>
                  <Input id="evt-address" autoComplete="off" {...register("address")} />
                </Field>
              </div>
            )}
            {locationMode !== "in-person" && (
              <Field label={t("meetingUrl")} error={errors.url?.message}>
                <Input
                  id="evt-url"
                  type="url"
                  placeholder="https://"
                  autoComplete="off"
                  {...register("url")}
                />
              </Field>
            )}
          </Section>

          <Section title={t("sectionOrganizer")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("organizerName")} error={errors.organizerName?.message} required>
                <Input id="evt-org" autoComplete="off" {...register("organizerName")} />
              </Field>
              <Field label={t("organizerContact")}>
                <Input id="evt-org-contact" autoComplete="off" {...register("organizerContact")} />
              </Field>
            </div>
            <Field label={t("capacity")} error={errors.capacity?.message} hint={t("capacityHint")}>
              <Input
                id="evt-capacity"
                type="number"
                inputMode="numeric"
                min={0}
                {...register("capacity")}
              />
            </Field>
          </Section>

          {!canPersist && (
            <p className="text-xs text-warning">{t("noPersistNote")}</p>
          )}

          <SheetFooter className="-mx-5">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={submitting || !canPersist} aria-busy={submitting}>
              {submitting ? tCommon("working") : <><Save /> {editing ? t("save") : t("create")}</>}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ms-0.5 text-danger">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
