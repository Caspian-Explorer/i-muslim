"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get("q") ?? "";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (new FormData(form).get("q") as string | null)?.trim() ?? "";
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={onSubmit} role="search" className="flex items-center">
      <label htmlFor="site-search" className="sr-only">
        Search Quran and Hadith
      </label>
      <div className="relative w-full sm:w-64">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          key={initial}
          id="site-search"
          name="q"
          type="search"
          placeholder="Search Quran and Hadith…"
          defaultValue={initial}
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 pl-8 text-sm placeholder:text-muted-foreground focus:border-accent focus:outline-none"
        />
      </div>
    </form>
  );
}
