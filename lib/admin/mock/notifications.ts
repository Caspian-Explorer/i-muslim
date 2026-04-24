import type { AdminNotification } from "@/types/admin";

export const MOCK_NOTIFICATIONS: AdminNotification[] = [
  {
    id: "n1",
    type: "signup",
    title: "New user signup",
    body: "Layla Nasser joined and is awaiting approval.",
    createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: "n2",
    type: "flagged",
    title: "Comment flagged",
    body: 'A comment on "Hijri new year" was flagged by 3 users.',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: "n3",
    type: "donation",
    title: "Large donation received",
    body: "$500 Zakat from Tariq Patel.",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: "n4",
    type: "qa",
    title: "New fatwa request",
    body: "Question about inheritance law — needs a scholar.",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: "n5",
    type: "system",
    title: "Prayer-times source degraded",
    body: "Adhan API latency above threshold for 15 minutes.",
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: "n6",
    type: "signup",
    title: "5 new signups in the last hour",
    body: "Traffic is above average for a Tuesday morning.",
    createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
];
