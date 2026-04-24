import Link from "next/link";
import { COLLECTIONS } from "@/lib/hadith";

export const metadata = {
  title: "Hadith — Major Collections",
  description:
    "Browse major Sunni hadith collections: Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa'i, Ibn Majah, Malik, Nawawi 40, Qudsi 40.",
};

export default function HadithIndexPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Hadith Collections
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Nine major collections. Select one to browse by book.
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COLLECTIONS.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/hadith/${c.slug}`}
              className="group block rounded-lg border border-border bg-background p-4 transition-colors hover:border-accent"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium">{c.name}</span>
                <span
                  dir="rtl"
                  lang="ar"
                  className="font-arabic text-lg text-foreground"
                >
                  {c.arabicName}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Tap to view books
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
