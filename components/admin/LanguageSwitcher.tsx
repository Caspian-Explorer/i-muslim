"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
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
import { LOCALES, LOCALE_COOKIE, LOCALE_META, type Locale } from "@/i18n/config";

function flagFor(code: Locale): string {
  return LOCALE_META[code]?.flag ?? "🌐";
}

function nativeNameFor(code: Locale): string {
  return LOCALE_META[code]?.nativeName ?? code.toUpperCase();
}

function persistLocaleCookie(code: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${code}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

type LanguageSwitcherProps = {
  // Locales the admin can switch into. Defaults to bundled + reserved-pool
  // when not provided so the component still works during a partial roll-out;
  // the AdminHeader passes the actual `bundled + activated` list so admins
  // don't pick a reserved locale that has no uploaded translations.
  availableLocales?: readonly Locale[];
};

export function LanguageSwitcher({ availableLocales }: LanguageSwitcherProps = {}) {
  const current = useLocale() as Locale;
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const visible: Locale[] = (() => {
    if (!availableLocales) return [...LOCALES];
    const set = new Set<Locale>(availableLocales);
    set.add(current);
    return LOCALES.filter((l) => set.has(l));
  })();

  function select(code: Locale) {
    if (code === current) return;
    persistLocaleCookie(code);
    // next-intl pathname is locale-less; replace with the same path under the
    // selected locale so the URL prefix updates.
    startTransition(() => {
      router.replace(pathname, { locale: code });
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("header.languageLabel", { label: nativeNameFor(current) })}
          aria-busy={isPending}
        >
          <Languages className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        <DropdownMenuLabel>{t("header.language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {visible.map((code) => (
          <DropdownMenuItem key={code} onClick={() => select(code)}>
            <span aria-hidden className="text-base leading-none">{flagFor(code)}</span>
            <span>{nativeNameFor(code)}</span>
            {current === code && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
