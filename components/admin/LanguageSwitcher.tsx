"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Lang = { code: string; label: string; flag: string; rtl?: boolean };

const LANGUAGES: Lang[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ar", label: "العربية", flag: "🇸🇦", rtl: true },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "id", label: "Bahasa", flag: "🇮🇩" },
];

const COOKIE = "i-muslim-lang";
const LANG_EVENT = "i-muslim-lang-change";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]!) : null;
}

function applyLang(code: string) {
  const lang = LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0]!;
  document.documentElement.lang = lang.code;
  document.documentElement.dir = lang.rtl ? "rtl" : "ltr";
  document.cookie = `${COOKIE}=${lang.code}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

function subscribeLang(cb: () => void) {
  window.addEventListener(LANG_EVENT, cb);
  return () => window.removeEventListener(LANG_EVENT, cb);
}

function readLang(): string {
  const stored = getCookie(COOKIE);
  if (stored) {
    const root = document.documentElement;
    if (root.lang !== stored) applyLang(stored);
    return stored;
  }
  return "en";
}

export function LanguageSwitcher() {
  const current = useSyncExternalStore(subscribeLang, readLang, () => "en");

  const select = useCallback((code: string) => {
    applyLang(code);
    window.dispatchEvent(new Event(LANG_EVENT));
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0]!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Language: ${currentLang.label}`}>
          <Languages className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGUAGES.map((l) => (
          <DropdownMenuItem key={l.code} onClick={() => select(l.code)}>
            <span aria-hidden className="text-base leading-none">{l.flag}</span>
            <span>{l.label}</span>
            {current === l.code && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
