import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Picks the value for `locale` from a localized text record, falling back to
// English. Used to render admin-authored content (business names, mosque
// descriptions, etc.) under any UI locale — including reserved ones for which
// no per-locale value exists.
export function pickLocalized<M extends object, K extends Extract<keyof M, string>>(
  map: M,
  locale: string,
  fallback: K,
): M[K] | undefined {
  const dynKey = locale as K;
  return (map as Record<K, M[K] | undefined>)[dynKey] ?? (map as Record<K, M[K] | undefined>)[fallback];
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function formatRelative(date: Date | string | number): string {
  const d = typeof date === "object" ? date : new Date(date);
  const diffMs = Date.now() - d.getTime();
  const sec = Math.round(diffMs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);

  if (sec < 45) return "just now";
  if (min < 60) return `${min} min ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 30) return `${day}d ago`;
  const months = Math.round(day / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}
