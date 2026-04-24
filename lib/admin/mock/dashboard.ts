import type { DashboardData, ActivityEntry, UpcomingEvent } from "@/types/admin";

function sparkline(seed: number, length = 14): number[] {
  const out: number[] = [];
  let prev = 50 + (seed % 30);
  for (let i = 0; i < length; i++) {
    const delta = Math.sin(seed + i * 0.7) * 12 + ((i * seed) % 7) - 3;
    prev = Math.max(5, prev + delta);
    out.push(Math.round(prev));
  }
  return out;
}

function growth(days: number, seed: number) {
  const out: Array<{ date: string; users: number }> = [];
  const now = Date.now();
  let users = 1200 + seed;
  for (let i = days; i >= 0; i--) {
    const delta = Math.round(Math.sin(i * 0.12 + seed) * 10 + (days - i) * 0.8);
    users = Math.max(0, users + delta + (i % 5 === 0 ? 20 : 5));
    out.push({
      date: new Date(now - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      users,
    });
  }
  return out;
}

const ACTIVITY: ActivityEntry[] = [
  {
    id: "a1",
    actor: "Aisha Rahman",
    actorAvatarUrl: "https://i.pravatar.cc/150?img=1",
    action: "approved",
    target: "3 pending user signups",
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: "a2",
    actor: "Yusuf Khan",
    actorAvatarUrl: "https://i.pravatar.cc/150?img=5",
    action: "published",
    target: 'article "Etiquette of Ramadan"',
    createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
  },
  {
    id: "a3",
    actor: "Fatima Ahmed",
    actorAvatarUrl: "https://i.pravatar.cc/150?img=8",
    action: "answered",
    target: "Q&A: Zakat on cryptocurrency",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "a4",
    actor: "System",
    actorAvatarUrl: null,
    action: "processed",
    target: "12 new donations ($4,320)",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "a5",
    actor: "Ibrahim Abdullah",
    actorAvatarUrl: "https://i.pravatar.cc/150?img=12",
    action: "flagged",
    target: 'a comment on "Hijri new year"',
    createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
  },
];

const UPCOMING: UpcomingEvent[] = [
  {
    id: "e1",
    title: "Friday Khutbah — Unity",
    startsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    rsvpCount: 142,
  },
  {
    id: "e2",
    title: "Tafsir Circle: Surah Al-Kahf",
    startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    rsvpCount: 58,
  },
  {
    id: "e3",
    title: "Community Iftar",
    startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    rsvpCount: 230,
  },
  {
    id: "e4",
    title: "Youth Halaqa",
    startsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    rsvpCount: 41,
  },
];

export function buildMockDashboard(): DashboardData {
  return {
    kpis: {
      totalUsers: { value: 1847, delta: 0.082, sparkline: sparkline(7) },
      activeThisWeek: { value: 934, delta: 0.041, sparkline: sparkline(13) },
      pendingApprovals: { value: 12, delta: -0.15, sparkline: sparkline(21) },
      donationsThisMonth: { value: 18420, delta: 0.217, sparkline: sparkline(5) },
    },
    userGrowth: {
      "30": growth(30, 3),
      "90": growth(90, 11),
      "365": growth(365, 29),
    },
    engagementByContent: [
      { kind: "Articles", value: 4820 },
      { kind: "Quran", value: 9120 },
      { kind: "Hadith", value: 3710 },
      { kind: "Duas", value: 2140 },
      { kind: "Events", value: 1180 },
    ],
    donationBreakdown: [
      { category: "Zakat", value: 9820 },
      { category: "Sadaqah", value: 5140 },
      { category: "General", value: 3460 },
    ],
    recentActivity: ACTIVITY,
    upcomingEvents: UPCOMING,
    source: "mock",
  };
}
