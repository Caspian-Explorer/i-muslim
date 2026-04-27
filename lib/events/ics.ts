import type { AdminEvent } from "@/types/admin";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toIcsDateUtc(d: Date): string {
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function fold(line: string): string {
  if (line.length <= 73) return line;
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    out.push((i === 0 ? "" : " ") + line.slice(i, i + 73));
    i += 73;
  }
  return out.join("\r\n");
}

export function buildIcs(event: AdminEvent, origin?: string): string {
  const dtStart = new Date(event.startsAt);
  const dtEnd = event.endsAt
    ? new Date(event.endsAt)
    : new Date(dtStart.getTime() + 60 * 60 * 1000);

  const description = [
    event.description,
    event.organizer?.name ? `Organizer: ${event.organizer.name}` : null,
    origin ? `${origin}/events/${event.id}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const locationParts = [
    event.location.venue,
    event.location.address,
    event.location.url,
  ].filter((s): s is string => Boolean(s));
  const location = locationParts.join(", ");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//i-muslim//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@i-muslim`,
    `DTSTAMP:${toIcsDateUtc(new Date())}`,
    `DTSTART:${toIcsDateUtc(dtStart)}`,
    `DTEND:${toIcsDateUtc(dtEnd)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    description ? `DESCRIPTION:${escapeIcs(description)}` : null,
    location ? `LOCATION:${escapeIcs(location)}` : null,
    event.recurrence ? event.recurrence.replace(/^DTSTART[^\n]*\n?/m, "").trim() : null,
    event.status === "cancelled" ? "STATUS:CANCELLED" : "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((s): s is string => Boolean(s));

  return lines.map(fold).join("\r\n") + "\r\n";
}
