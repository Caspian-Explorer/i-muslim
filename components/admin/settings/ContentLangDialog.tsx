"use client";

import { useTranslations } from "next-intl";
import { Copy, ExternalLink } from "lucide-react";
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
import type { LangCode } from "@/lib/translations";
import type { HadithCollectionStats } from "@/lib/admin/data/content-translation-stats";

type Stats = { total: number; perLang: Partial<Record<LangCode, number>> };

const NATIVE_NAMES: Record<string, string> = {
  ar: "العربية",
  en: "English",
  ru: "Русский",
  az: "Azərbaycanca",
  tr: "Türkçe",
};

const FLAGS: Record<string, string> = {
  ar: "🇸🇦",
  en: "🇬🇧",
  ru: "🇷🇺",
  az: "🇦🇿",
  tr: "🇹🇷",
};

export type ContentLangDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: "quran" | "hadith";
  code: LangCode | null;
  stats: Stats;
  // Per-collection breakdown for Hadith (already in props — no lazy load).
  // Empty array for Qur'an or when no Hadith data is seeded yet.
  perCollection: HadithCollectionStats[];
  enabled: boolean;
  onToggleEnabled: (code: LangCode) => void;
};

export function ContentLangDialog({
  open,
  onOpenChange,
  kind,
  code,
  stats,
  perCollection,
  enabled,
  onToggleEnabled,
}: ContentLangDialogProps) {
  const t = useTranslations("adminSettings.languages.content");
  const tCommon = useTranslations("common");

  if (!code) return null;

  const isArabic = code === "ar";
  const translated = stats.perLang[code] ?? (isArabic ? stats.total : 0);
  const percent =
    stats.total === 0 ? 0 : Math.round((translated / stats.total) * 100);
  const native = NATIVE_NAMES[code] ?? code.toUpperCase();
  const flag = FLAGS[code] ?? "🌐";
  const seedCommand =
    kind === "quran"
      ? `npm run seed:quran:lang -- --lang=${code}`
      : `npm run seed:hadith:lang -- --lang=${code}`;
  const editorHref = kind === "quran" ? "/admin/quran" : "/admin/hadith";

  function copySeedCommand() {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(seedCommand)
      .then(() => toast.success(t("seedCommandCopied")))
      .catch(() => toast.error(t("seedCommandCopyFailed")));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            <span aria-hidden className="mr-1">
              {flag}
            </span>
            {native} — {kind === "quran" ? t("titleQuran") : t("titleHadith")}
          </DialogTitle>
          <DialogDescription>
            {code.toUpperCase()} · {translated.toLocaleString()} /{" "}
            {stats.total.toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <StatsPanel
            percent={percent}
            translated={translated}
            total={stats.total}
            translatedLabel={t("statsTranslated")}
            totalLabel={t("statsTotal")}
            percentLabel={t("statsPercent")}
          />

          <label className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("toggleLabel")}</p>
              <p className="text-xs text-muted-foreground">{t("toggleHint")}</p>
            </div>
            <input
              type="checkbox"
              checked={enabled || isArabic}
              disabled={isArabic}
              onChange={() => onToggleEnabled(code)}
              className="size-4"
              aria-label={t("toggleLabel")}
            />
          </label>

          {kind === "hadith" && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("perCollectionTitle")}</p>
              {perCollection.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t("perCollectionEmpty")}
                </p>
              ) : (
                <ul className="divide-y divide-border rounded-md border border-border bg-card text-sm">
                  {perCollection.map(({ slug, total, translated }) => {
                    const collectionPercent =
                      total === 0
                        ? 0
                        : Math.round((translated / total) * 100);
                    const tone =
                      collectionPercent >= 95
                        ? "text-emerald-700 dark:text-emerald-300"
                        : collectionPercent >= 50
                          ? "text-amber-700 dark:text-amber-300"
                          : "text-rose-700 dark:text-rose-300";
                    return (
                      <li
                        key={slug}
                        className="flex items-center justify-between gap-3 px-3 py-2"
                      >
                        <span className="truncate font-medium">{slug}</span>
                        <span className="flex shrink-0 items-center gap-3 tabular-nums">
                          <span className="text-xs text-muted-foreground">
                            {translated.toLocaleString()} /{" "}
                            {total.toLocaleString()}
                          </span>
                          <span className={`text-xs font-medium ${tone}`}>
                            {collectionPercent}%
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {!isArabic && (
            <div className="space-y-2 rounded-md border border-dashed border-border bg-muted/30 px-4 py-3">
              <p className="text-sm font-medium">{t("seedCommandTitle")}</p>
              <p className="text-xs text-muted-foreground">
                {t("seedCommandHint")}
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-background px-2 py-1 font-mono text-xs">
                  {seedCommand}
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={copySeedCommand}
                >
                  <Copy className="size-3.5" />
                  {tCommon("copy")}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" asChild>
            <a href={editorHref} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" />
              {kind === "quran"
                ? t("openQuranEditor")
                : t("openHadithEditor")}
            </a>
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            {tCommon("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatsPanel({
  percent,
  translated,
  total,
  translatedLabel,
  totalLabel,
  percentLabel,
}: {
  percent: number;
  translated: number;
  total: number;
  translatedLabel: string;
  totalLabel: string;
  percentLabel: string;
}) {
  const tone =
    percent >= 95
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : percent >= 50
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : "bg-rose-500/10 text-rose-700 dark:text-rose-300";
  return (
    <div className="grid grid-cols-3 gap-3">
      <Stat label={translatedLabel} value={translated.toLocaleString()} />
      <Stat label={totalLabel} value={total.toLocaleString()} />
      <Stat
        label={percentLabel}
        value={`${percent}%`}
        valueClassName={`rounded-md px-2 py-1 ${tone}`}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 text-lg font-semibold tabular-nums ${valueClassName ?? ""}`}
      >
        {value}
      </p>
    </div>
  );
}
