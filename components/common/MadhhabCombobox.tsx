"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronsUpDown, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { Madhhab } from "@/types/matrimonial";

const MADHHAB_OPTIONS: Madhhab[] = [
  "hanafi",
  "maliki",
  "shafii",
  "hanbali",
  "other",
  "none",
];

interface Props {
  value: Madhhab[];
  onChange: (next: Madhhab[]) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  ariaLabel?: string;
}

const MAX_VISIBLE_CHIPS = 3;

export function MadhhabCombobox({
  value,
  onChange,
  placeholder,
  disabled,
  id,
  className,
  ariaLabel,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const t = useTranslations("madhhabCombobox");
  const tMadhhab = useTranslations("matrimonial.madhhabs");

  function handleSelect(code: Madhhab) {
    const set = new Set(value);
    if (set.has(code)) set.delete(code);
    else set.add(code);
    onChange(Array.from(set));
  }

  function handleRemoveChip(code: Madhhab, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onChange(value.filter((c) => c !== code));
  }

  return (
    <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={ariaLabel}
          className={cn(
            "flex min-h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          {value.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1 min-w-0 py-0.5">
              {value.slice(0, MAX_VISIBLE_CHIPS).map((code) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-1 rounded-sm border border-border bg-muted px-1.5 py-0.5 text-xs"
                >
                  <span className="truncate max-w-[8rem]">
                    {tMadhhab(code)}
                  </span>
                  {!disabled && (
                    <span
                      role="button"
                      aria-label={t("removeChip", { name: tMadhhab(code) })}
                      onClick={(e) => handleRemoveChip(code, e)}
                      className="rounded-sm text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="size-3" />
                    </span>
                  )}
                </span>
              ))}
              {value.length > MAX_VISIBLE_CHIPS && (
                <span className="text-xs text-muted-foreground">
                  {t("moreMadhhabs", { count: value.length - MAX_VISIBLE_CHIPS })}
                </span>
              )}
            </div>
          ) : (
            <span className="truncate text-start text-muted-foreground">
              {placeholder ?? t("selectMadhhabs")}
            </span>
          )}
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command>
          <CommandInput placeholder={t("searchPlaceholder")} />
          <CommandList>
            <CommandEmpty>{t("noResults")}</CommandEmpty>
            <CommandGroup>
              {MADHHAB_OPTIONS.map((code) => {
                const isSelected = value.includes(code);
                const label = tMadhhab(code);
                return (
                  <CommandItem
                    key={code}
                    value={`${code} ${label}`}
                    onSelect={() => handleSelect(code)}
                    className={cn(
                      "px-2 py-2 cursor-pointer",
                      isSelected && "ui-selected",
                    )}
                  >
                    <span className="flex-1 truncate">{label}</span>
                    <Check
                      className={cn(
                        "size-4 ml-2 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
