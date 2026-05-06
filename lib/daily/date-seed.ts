// Deterministic "of the day" rotation helpers. Same date → same index, regardless
// of who is viewing or how the request is rendered.

function localDateKey(date: Date, tz?: string): string {
  if (!tz) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(date);
}

export function dateSeed(date: Date, tz?: string): number {
  const key = localDateKey(date, tz);
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function pickIndexByDate(modulo: number, date: Date, tz?: string): number {
  if (modulo <= 0) return 0;
  return dateSeed(date, tz) % modulo;
}

export function pickByDate<T>(items: readonly T[], date: Date, tz?: string): T {
  if (items.length === 0) {
    throw new Error("pickByDate: items must be non-empty");
  }
  return items[pickIndexByDate(items.length, date, tz)]!;
}
