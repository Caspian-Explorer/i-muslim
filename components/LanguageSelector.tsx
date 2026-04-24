"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  ALL_LANGS,
  LANG_LABELS,
  parseLangsParam,
  serializeLangs,
} from "@/lib/translations";
import type { LangCode } from "@/lib/translations";

const STORAGE_KEY = "i-muslim.langs";

export function LanguageSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = parseLangsParam(searchParams.get("lang"));

  // On first mount, if URL has no ?lang= but localStorage remembers a
  // preference, push a redirect so the server rerenders with saved prefs.
  useEffect(() => {
    if (searchParams.get("lang")) return;
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const parsed = parseLangsParam(saved);
    if (parsed.length === 0) return;
    const qs = new URLSearchParams(searchParams.toString());
    qs.set("lang", serializeLangs(parsed));
    router.replace(`${pathname}?${qs.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(lang: LangCode) {
    const set = new Set(current);
    if (lang === "ar") return; // Arabic always on
    if (set.has(lang)) set.delete(lang);
    else set.add(lang);
    set.add("ar");
    const next = Array.from(set) as LangCode[];
    const ordered = ALL_LANGS.filter((l) => next.includes(l));
    const serialized = serializeLangs(ordered);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, serialized);
    }
    const qs = new URLSearchParams(searchParams.toString());
    qs.set("lang", serialized);
    router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        Translations:
      </span>
      {ALL_LANGS.map((lang) => {
        const active = current.includes(lang);
        const locked = lang === "ar";
        return (
          <button
            key={lang}
            type="button"
            aria-pressed={active}
            disabled={locked}
            onClick={() => toggle(lang)}
            className={
              active
                ? "rounded-full border border-accent bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
                : "rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            }
            title={locked ? "Arabic is always shown" : undefined}
          >
            {LANG_LABELS[lang]}
          </button>
        );
      })}
    </div>
  );
}
