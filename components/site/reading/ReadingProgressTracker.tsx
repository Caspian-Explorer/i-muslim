"use client";

import { useEffect, useRef } from "react";

const ENDPOINT = "/api/profile/reading-progress";
const VISIBILITY_THRESHOLD_MS = 2000;

type Variant =
  | { kind: "quran"; surah: number }
  | { kind: "hadith"; collection: string; book: number };

interface QuranVisible {
  variant: "quran";
  surah: number;
  ayah: number;
  verseKey: string;
}

interface HadithVisible {
  variant: "hadith";
  collection: string;
  book: number;
  number: number;
}

type Visible = QuranVisible | HadithVisible;

interface Props {
  variant: Variant;
}

export function ReadingProgressTracker({ variant }: Props) {
  const latest = useRef<Visible | null>(null);
  const flushed = useRef<string | null>(null);

  useEffect(() => {
    const elements: Element[] =
      variant.kind === "quran"
        ? Array.from(document.querySelectorAll<HTMLElement>("[data-ayah-id][data-ayah]"))
        : Array.from(document.querySelectorAll<HTMLElement>("[data-hadith-number]"));

    if (elements.length === 0) return;

    const visibilityTimers = new Map<Element, number>();
    const visibleElements = new Set<Element>();

    function commitVisible(el: Element) {
      if (variant.kind === "quran") {
        const ayahNum = Number((el as HTMLElement).dataset.ayah);
        const verseKey = (el as HTMLElement).dataset.ayahId;
        if (Number.isFinite(ayahNum) && ayahNum >= 1 && verseKey) {
          latest.current = {
            variant: "quran",
            surah: variant.surah,
            ayah: ayahNum,
            verseKey,
          };
        }
      } else {
        const num = Number((el as HTMLElement).dataset.hadithNumber);
        if (Number.isFinite(num) && num >= 1) {
          latest.current = {
            variant: "hadith",
            collection: variant.collection,
            book: variant.book,
            number: num,
          };
        }
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            visibleElements.add(entry.target);
            const timer = window.setTimeout(() => {
              if (visibleElements.has(entry.target)) {
                commitVisible(entry.target);
              }
            }, VISIBILITY_THRESHOLD_MS);
            visibilityTimers.set(entry.target, timer);
          } else {
            visibleElements.delete(entry.target);
            const timer = visibilityTimers.get(entry.target);
            if (timer != null) {
              window.clearTimeout(timer);
              visibilityTimers.delete(entry.target);
            }
          }
        }
      },
      { threshold: [0.5] },
    );

    for (const el of elements) observer.observe(el);

    function flush() {
      const v = latest.current;
      if (!v) return;
      const key = JSON.stringify(v);
      if (flushed.current === key) return;
      flushed.current = key;
      const body = JSON.stringify(v);
      try {
        if (typeof navigator.sendBeacon === "function") {
          const blob = new Blob([body], { type: "application/json" });
          navigator.sendBeacon(ENDPOINT, blob);
          return;
        }
      } catch {
        // fall through to fetch
      }
      try {
        fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {
          // ignore
        });
      } catch {
        // ignore
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") flush();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", flush);

    return () => {
      observer.disconnect();
      for (const timer of visibilityTimers.values()) window.clearTimeout(timer);
      visibilityTimers.clear();
      visibleElements.clear();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flush);
    };
  }, [variant]);

  return null;
}
