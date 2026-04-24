import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getArabicEdition,
  getBooksFromEdition,
  getCollection,
  getEditionsForLangs,
  filterHadithsByBook,
  indexByHadithNumber,
} from "@/lib/hadith";
import { parseLangsParam } from "@/lib/translations";
import type { LangCode } from "@/lib/translations";
import { Suspense } from "react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { HadithCard, type HadithTranslationSlice } from "@/components/HadithCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string; book: string }>;
}) {
  const { collection, book } = await params;
  const meta = getCollection(collection);
  if (!meta) return {};
  return {
    title: `${meta.name} — Book ${book}`,
  };
}

export default async function HadithBookPage({
  params,
  searchParams,
}: {
  params: Promise<{ collection: string; book: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { collection, book } = await params;
  const { lang: langParam } = await searchParams;
  const meta = getCollection(collection);
  console.log("[hadith/book] collection:", collection, "book:", book, "metaFound:", !!meta);
  if (!meta) notFound();

  const bookNumber = Number(book);
  console.log("[hadith/book] bookNumber:", bookNumber);
  if (!Number.isInteger(bookNumber) || bookNumber < 1) notFound();

  const langs = parseLangsParam(langParam);
  const nonArabic = langs.filter((l): l is Exclude<LangCode, "ar"> => l !== "ar");
  const showArabic = langs.includes("ar");

  const [arabicEdition, translationsMap] = await Promise.all([
    getArabicEdition(collection),
    getEditionsForLangs(collection, langs),
  ]);

  const books = getBooksFromEdition(arabicEdition);
  console.log("[hadith/book] books.length:", books.length, "firstFew:", books.slice(0, 3).map((b) => ({ n: b.number, name: b.name.slice(0, 30) })));
  const bookMeta = books.find((b) => b.number === bookNumber);
  console.log("[hadith/book] bookMeta found:", !!bookMeta);
  if (!bookMeta) notFound();

  const arabicHadiths = filterHadithsByBook(arabicEdition.hadiths, bookNumber);

  // Build per-language indexes for quick lookup by hadithnumber.
  const langIndexes = new Map<
    LangCode,
    {
      actual: LangCode;
      fallback: boolean;
      index: ReturnType<typeof indexByHadithNumber>;
    }
  >();
  for (const [requested, info] of translationsMap.entries()) {
    langIndexes.set(requested, {
      actual: info.actualLang,
      fallback: info.fallback,
      index: indexByHadithNumber(info.edition.hadiths),
    });
  }

  const prev = books.find((b) => b.number === bookNumber - 1);
  const next = books.find((b) => b.number === bookNumber + 1);
  const langQS = langParam ? `?lang=${encodeURIComponent(langParam)}` : "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href={`/hadith/${collection}${langQS}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← {meta.name}
      </Link>

      <header className="mt-4 border-b border-border pb-6">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {meta.name} · Book {bookNumber}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {bookMeta.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {arabicHadiths.length} hadith in this book.
        </p>
        <div className="mt-4">
          <Suspense fallback={<div className="h-8" />}>
            <LanguageSelector />
          </Suspense>
        </div>
      </header>

      <div className="mt-6 space-y-4">
        {arabicHadiths.map((h) => {
          const translations: HadithTranslationSlice[] = nonArabic.map((lang) => {
            const info = langIndexes.get(lang);
            if (!info) {
              return {
                requested: lang,
                actual: null,
                entry: null,
                fallback: false,
              };
            }
            const entry = info.index.get(h.hadithnumber) ?? null;
            return {
              requested: lang,
              actual: info.actual,
              entry,
              fallback: info.fallback,
            };
          });
          return (
            <HadithCard
              key={h.hadithnumber}
              number={h.hadithnumber}
              arabic={showArabic ? h : null}
              translations={translations}
              collectionShortName={meta.shortName ?? meta.name}
            />
          );
        })}
      </div>

      <nav className="mt-8 flex items-center justify-between gap-2 text-sm">
        {prev ? (
          <Link
            href={`/hadith/${collection}/${prev.number}${langQS}`}
            className="rounded-md border border-border bg-background px-3 py-2 hover:border-accent"
          >
            ← Book {prev.number}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/hadith/${collection}/${next.number}${langQS}`}
            className="rounded-md border border-border bg-background px-3 py-2 hover:border-accent"
          >
            Book {next.number} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
