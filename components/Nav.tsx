import Link from "next/link";
import { Suspense } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { SearchBar } from "./SearchBar";

function SearchBarFallback() {
  return (
    <div className="h-9 w-full sm:w-64 rounded-md border border-border bg-background" />
  );
}

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-foreground text-sm">
            ۞
          </span>
          <span className="hidden sm:inline">i-muslim</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/quran"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Quran
          </Link>
          <Link
            href="/hadith"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Hadith
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <Suspense fallback={<SearchBarFallback />}>
              <SearchBar />
            </Suspense>
          </div>
          <ThemeToggle />
        </div>
      </div>
      <div className="border-t border-border px-4 py-2 sm:hidden">
        <Suspense fallback={<SearchBarFallback />}>
          <SearchBar />
        </Suspense>
      </div>
    </header>
  );
}
