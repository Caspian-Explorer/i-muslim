"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { ADMIN_NAV } from "@/lib/admin/nav";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className="gap-2 text-muted-foreground font-normal w-full justify-start md:w-64"
        onClick={() => setOpen(true)}
        aria-label="Open command palette"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages, users, settings…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          {ADMIN_NAV.map((group) => (
            <CommandGroup key={group.id} heading={group.label}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.href}
                  value={`${item.label} ${group.label}`}
                  onSelect={() => go(item.href)}
                >
                  <item.icon />
                  <span>{item.label}</span>
                  <CornerDownLeft className="ml-auto size-3.5 text-muted-foreground opacity-0 group-data-[selected=true]:opacity-100" />
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
