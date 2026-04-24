import umalqura from "@umalqura/core";

const MONTH_NAMES = [
  "Muharram",
  "Safar",
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  "Jumada al-Awwal",
  "Jumada al-Thani",
  "Rajab",
  "Sha'ban",
  "Ramadan",
  "Shawwal",
  "Dhu al-Qi'dah",
  "Dhu al-Hijjah",
];

export function formatHijri(date: Date = new Date()): string {
  const h = umalqura(date);
  return `${h.hd} ${MONTH_NAMES[h.hm - 1]} ${h.hy}`;
}

export function formatGregorian(date: Date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
