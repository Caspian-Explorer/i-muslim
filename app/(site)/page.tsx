import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-20">
      <section className="text-center">
        <p
          dir="rtl"
          lang="ar"
          className="font-arabic text-4xl text-accent sm:text-5xl"
        >
          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
        </p>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
          Read the Quran and Sunnah.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          A clean, fast reader for the Quran and the major Hadith collections,
          with Arabic alongside English, Russian, and Azerbaijani translations.
        </p>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        <Link
          href="/quran"
          className="group rounded-xl border border-border bg-background p-6 transition-colors hover:border-accent"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Quran</h2>
            <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse all 114 surahs, read ayat in Arabic with your chosen
            translations side-by-side.
          </p>
        </Link>

        <Link
          href="/hadith"
          className="group rounded-xl border border-border bg-background p-6 transition-colors hover:border-accent"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Hadith</h2>
            <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse major collections — Bukhari, Muslim, Abu Dawud, Tirmidhi,
            Nasa&rsquo;i, Ibn Majah, and more.
          </p>
        </Link>
      </section>
    </div>
  );
}
