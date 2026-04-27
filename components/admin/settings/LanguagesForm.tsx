"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LOCALES,
  LOCALE_META,
  DEFAULT_LOCALE,
  BUNDLED_LOCALES,
  type Locale,
} from "@/i18n/config";
import { ALL_LANGS, type LangCode } from "@/lib/translations";
import { updateLanguageSettings, deactivateUiLocaleAction } from "@/app/[locale]/(admin)/admin/settings/_actions";
import { ActivateLocaleDialog } from "./ActivateLocaleDialog";

const CONTENT_FLAGS: Record<string, string> = {
  ar: "🇸🇦",
  en: "🇬🇧",
  ru: "🇷🇺",
  az: "🇦🇿",
  tr: "🇹🇷",
};

const CONTENT_NATIVE: Record<string, string> = {
  ar: "العربية",
  en: "English",
  ru: "Русский",
  az: "Azərbaycanca",
  tr: "Türkçe",
};

const CONTENT_DEFAULT: LangCode = "ar";

export type ReservedLocaleSummary = {
  code: Locale;
  activated: boolean;
  nativeName: string;
  englishName: string;
  flag: string;
  rtl: boolean;
  baseLocale: Locale;
  messages: Record<string, unknown>;
};

export type LanguagesFormProps = {
  initial: {
    uiEnabled: Locale[];
    quranEnabled: LangCode[];
    hadithEnabled: LangCode[];
    reservedLocales: ReservedLocaleSummary[];
  };
};

function setEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set<T>(a);
  return b.every((v) => set.has(v));
}

export function LanguagesForm({ initial }: LanguagesFormProps) {
  const t = useTranslations("adminSettings.languages");
  const tCommon = useTranslations("common");

  // ── Per-tab working state + saved snapshot. Save buttons compare working ↔
  //    snapshot to compute dirty per-tab.
  const [uiEnabled, setUiEnabled] = useState<Set<Locale>>(() => new Set(initial.uiEnabled));
  const [quranEnabled, setQuranEnabled] = useState<Set<LangCode>>(() => new Set(initial.quranEnabled));
  const [hadithEnabled, setHadithEnabled] = useState<Set<LangCode>>(() => new Set(initial.hadithEnabled));
  const [reserved, setReserved] = useState<ReservedLocaleSummary[]>(initial.reservedLocales);

  const [savedSnapshot, setSavedSnapshot] = useState({
    ui: initial.uiEnabled,
    quran: initial.quranEnabled,
    hadith: initial.hadithEnabled,
  });

  const [pending, startTransition] = useTransition();
  const [pendingTab, setPendingTab] = useState<"ui" | "quran" | "hadith" | null>(null);

  // ── Dirty flags per tab.
  const uiDirty = useMemo(() => {
    const now = LOCALES.filter((l) => uiEnabled.has(l));
    return !setEqual(now, savedSnapshot.ui);
  }, [uiEnabled, savedSnapshot.ui]);

  const quranDirty = useMemo(() => {
    const now = ALL_LANGS.filter((l) => quranEnabled.has(l));
    return !setEqual(now, savedSnapshot.quran);
  }, [quranEnabled, savedSnapshot.quran]);

  const hadithDirty = useMemo(() => {
    const now = ALL_LANGS.filter((l) => hadithEnabled.has(l));
    return !setEqual(now, savedSnapshot.hadith);
  }, [hadithEnabled, savedSnapshot.hadith]);

  // Activated subset — used to gate the Interface toggle (a reserved locale
  // has to be activated before it can be toggled into the public switcher).
  const activatedReserved: Set<Locale> = useMemo(() => {
    const out = new Set<Locale>();
    for (const r of reserved) if (r.activated) out.add(r.code);
    return out;
  }, [reserved]);

  function isUsable(code: Locale): boolean {
    return (BUNDLED_LOCALES as readonly string[]).includes(code) || activatedReserved.has(code);
  }

  function toggleUi(code: Locale) {
    if (code === DEFAULT_LOCALE) return;
    if (!isUsable(code)) return;
    setUiEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function toggleContent(setEn: typeof setQuranEnabled, code: LangCode) {
    if (code === CONTENT_DEFAULT) return;
    setEn((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  // ── Saves. Each tab's button only modifies its own slice on the server;
  //    the action requires all three fields, so we send saved-snapshot values
  //    for the other two and the current working set for the active tab.
  function save(tab: "ui" | "quran" | "hadith") {
    const payload = {
      uiEnabled: tab === "ui" ? LOCALES.filter((l) => uiEnabled.has(l)) : savedSnapshot.ui,
      quranEnabled: tab === "quran" ? ALL_LANGS.filter((l) => quranEnabled.has(l)) : savedSnapshot.quran,
      hadithEnabled: tab === "hadith" ? ALL_LANGS.filter((l) => hadithEnabled.has(l)) : savedSnapshot.hadith,
    };
    setPendingTab(tab);
    startTransition(async () => {
      try {
        const res = await updateLanguageSettings(payload);
        if (res.ok) {
          setSavedSnapshot({
            ui: res.settings.uiEnabled,
            quran: res.settings.quranEnabled,
            hadith: res.settings.hadithEnabled,
          });
          setUiEnabled(new Set(res.settings.uiEnabled));
          setQuranEnabled(new Set(res.settings.quranEnabled));
          setHadithEnabled(new Set(res.settings.hadithEnabled));
          toast.success(t("savedToast"));
        } else {
          toast.error(t("errorToast"));
        }
      } finally {
        setPendingTab(null);
      }
    });
  }

  // ── Reserved-locale dialog.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<Locale | null>(null);
  const editingDoc = useMemo(
    () => (editingCode ? reserved.find((r) => r.code === editingCode && r.activated) : undefined),
    [editingCode, reserved],
  );

  function openActivateDialog(code: Locale) {
    setEditingCode(code);
    setDialogOpen(true);
  }

  function onDialogSaved() {
    if (!editingCode) return;
    setReserved((prev) =>
      prev.map((r) => (r.code === editingCode ? { ...r, activated: true } : r)),
    );
  }

  function onDeactivate(code: Locale) {
    startTransition(async () => {
      const res = await deactivateUiLocaleAction(code);
      if (res.ok) {
        setReserved((prev) => prev.map((r) => (r.code === code ? { ...r, activated: false } : r)));
        // If the locale was enabled in uiEnabled, drop it — a deactivated
        // locale shouldn't leak into the public switcher.
        setUiEnabled((prev) => {
          if (!prev.has(code)) return prev;
          const next = new Set(prev);
          next.delete(code);
          return next;
        });
        toast.success(t("deactivatedToast"));
      } else {
        toast.error(t("errorToast"));
      }
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <Tabs defaultValue="interface" className="space-y-4">
      <TabsList>
        <TabsTrigger value="interface">{t("tabs.interface")}</TabsTrigger>
        <TabsTrigger value="quran">{t("tabs.quran")}</TabsTrigger>
        <TabsTrigger value="hadith">{t("tabs.hadith")}</TabsTrigger>
      </TabsList>

      <TabsContent value="interface" className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">{t("uiSection")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("uiDescription")}</p>
        </div>

        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {LOCALES.map((code) => {
            const isDefault = code === DEFAULT_LOCALE;
            const reservedDoc = reserved.find((r) => r.code === code);
            const status: "bundled" | "activated" | "unactivated" =
              (BUNDLED_LOCALES as readonly string[]).includes(code)
                ? "bundled"
                : reservedDoc?.activated
                  ? "activated"
                  : "unactivated";
            const meta = LOCALE_META[code];
            const usable = status !== "unactivated";
            const checked = uiEnabled.has(code) || isDefault;

            return (
              <li
                key={code}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span aria-hidden className="text-xl leading-none">
                    {reservedDoc?.flag || meta?.flag || "🌐"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {reservedDoc?.nativeName || meta?.nativeName || code.toUpperCase()}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {code}
                      {isDefault
                        ? ` · ${t("defaultLockedHint")}`
                        : status === "activated"
                          ? ` · ${t("activatedHint")}`
                          : status === "unactivated"
                            ? ` · ${t("notActivatedHint")}`
                            : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {status === "activated" && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => openActivateDialog(code)}
                        disabled={pending}
                      >
                        <Pencil className="size-3.5" />
                        {t("editTranslations")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeactivate(code)}
                        disabled={pending}
                        aria-label={t("deactivate")}
                        title={t("deactivate")}
                      >
                        <Power className="size-3.5" />
                      </Button>
                    </>
                  )}
                  {status === "unactivated" && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => openActivateDialog(code)}
                      disabled={pending}
                    >
                      <Plus className="size-3.5" />
                      {t("activate.activate")}
                    </Button>
                  )}
                  <ToggleSwitch
                    checked={checked}
                    disabled={isDefault || !usable}
                    onChange={() => toggleUi(code)}
                    label={meta?.nativeName ?? code}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        <SaveBar
          dirty={uiDirty}
          pending={pending && pendingTab === "ui"}
          onSave={() => save("ui")}
          tCommon={tCommon}
          t={t}
        />
      </TabsContent>

      <TabsContent value="quran" className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">{t("quranSection")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("quranDescription")}</p>
        </div>

        <ContentLangList
          enabled={quranEnabled}
          onToggle={(c) => toggleContent(setQuranEnabled, c)}
          defaultHint={t("defaultLockedHint")}
        />

        <SaveBar
          dirty={quranDirty}
          pending={pending && pendingTab === "quran"}
          onSave={() => save("quran")}
          tCommon={tCommon}
          t={t}
        />
      </TabsContent>

      <TabsContent value="hadith" className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">{t("hadithSection")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("hadithDescription")}</p>
        </div>

        <ContentLangList
          enabled={hadithEnabled}
          onToggle={(c) => toggleContent(setHadithEnabled, c)}
          defaultHint={t("defaultLockedHint")}
        />

        <SaveBar
          dirty={hadithDirty}
          pending={pending && pendingTab === "hadith"}
          onSave={() => save("hadith")}
          tCommon={tCommon}
          t={t}
        />
      </TabsContent>

      <ActivateLocaleDialog
        // Remount the dialog whenever the target locale changes so its
        // form state is reinitialised from props without a useEffect.
        key={editingCode ?? "none"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        code={editingCode}
        initial={
          editingDoc
            ? {
                nativeName: editingDoc.nativeName,
                englishName: editingDoc.englishName,
                flag: editingDoc.flag,
                rtl: editingDoc.rtl,
                baseLocale: editingDoc.baseLocale,
                messages: editingDoc.messages,
              }
            : undefined
        }
        onSaved={onDialogSaved}
      />
    </Tabs>
  );
}

function ContentLangList({
  enabled,
  onToggle,
  defaultHint,
}: {
  enabled: Set<LangCode>;
  onToggle: (code: LangCode) => void;
  defaultHint: string;
}) {
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {ALL_LANGS.map((code) => {
        const isDefault = code === CONTENT_DEFAULT;
        const checked = enabled.has(code) || isDefault;
        return (
          <LanguageRow
            key={code}
            code={code}
            flag={CONTENT_FLAGS[code] ?? "🌐"}
            native={CONTENT_NATIVE[code] ?? code.toUpperCase()}
            checked={checked}
            isDefault={isDefault}
            defaultHint={defaultHint}
            onToggle={() => onToggle(code)}
          />
        );
      })}
    </ul>
  );
}

function SaveBar({
  dirty,
  pending,
  onSave,
  tCommon,
  t,
}: {
  dirty: boolean;
  pending: boolean;
  onSave: () => void;
  tCommon: ReturnType<typeof useTranslations>;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="flex items-center justify-end gap-3">
      {dirty && (
        <span className="text-xs text-muted-foreground">{t("unsavedChanges")}</span>
      )}
      <Button type="button" onClick={onSave} disabled={!dirty || pending} aria-busy={pending}>
        {pending ? tCommon("loading") : t("save")}
      </Button>
    </div>
  );
}

function LanguageRow({
  code,
  flag,
  native,
  checked,
  isDefault,
  defaultHint,
  onToggle,
}: {
  code: string;
  flag: string;
  native: string;
  checked: boolean;
  isDefault: boolean;
  defaultHint: string;
  onToggle: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden className="text-xl leading-none">
          {flag}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{native}</p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {code}
            {isDefault ? ` · ${defaultHint}` : ""}
          </p>
        </div>
      </div>
      <ToggleSwitch checked={checked} disabled={isDefault} onChange={onToggle} label={native} />
    </li>
  );
}

function ToggleSwitch({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={[
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        checked ? "bg-primary" : "bg-muted",
        disabled ? "cursor-not-allowed opacity-60" : "",
      ].join(" ")}
    >
      <span
        aria-hidden
        className={[
          "pointer-events-none inline-block size-5 transform rounded-full bg-background shadow-sm ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        ].join(" ")}
      />
    </button>
  );
}

