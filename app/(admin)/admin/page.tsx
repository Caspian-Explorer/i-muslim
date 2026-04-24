import type { Metadata } from "next";
import { AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HijriDate } from "@/components/admin/HijriDate";
import { PrayerTimesWidget } from "@/components/admin/PrayerTimesWidget";
import { StatCard } from "@/components/admin/StatCard";
import { UserGrowthChart } from "@/components/admin/charts/UserGrowthChart";
import { EngagementBarChart } from "@/components/admin/charts/EngagementBarChart";
import { DonationDonutChart } from "@/components/admin/charts/DonationDonutChart";
import { requireAdminSession } from "@/lib/auth/session";
import { fetchDashboard } from "@/lib/admin/data/dashboard";
import { formatRelative, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

function firstName(name: string | null, email: string): string {
  if (name) return name.split(/\s+/)[0] ?? name;
  return email.split("@")[0] ?? "friend";
}

function formatUsd(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value.toLocaleString()}`;
}

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default async function DashboardPage() {
  const session = await requireAdminSession();
  const data = await fetchDashboard();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Assalamu alaikum, {firstName(session.name, session.email)}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <HijriDate />
            <span aria-hidden>·</span>
            <span>{new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
        </div>
        <div className="md:min-w-[320px] md:flex-1 md:max-w-[560px]">
          <PrayerTimesWidget />
        </div>
      </div>

      {data.source === "mock" && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />
          <div className="text-foreground">
            Showing sample data.{" "}
            <span className="text-muted-foreground">
              Configure Firebase Admin (see <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">.env.example</code>) and add documents to the <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">users</code> / <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">donations</code> collections in the <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">main</code> database to see live counts.
            </span>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total users"
          value={data.kpis.totalUsers.value}
          delta={data.kpis.totalUsers.delta}
          sparkline={data.kpis.totalUsers.sparkline}
        />
        <StatCard
          label="Active this week"
          value={data.kpis.activeThisWeek.value}
          delta={data.kpis.activeThisWeek.delta}
          sparkline={data.kpis.activeThisWeek.sparkline}
        />
        <StatCard
          label="Pending approvals"
          value={data.kpis.pendingApprovals.value}
          delta={data.kpis.pendingApprovals.delta}
          sparkline={data.kpis.pendingApprovals.sparkline}
        />
        <StatCard
          label="Donations (month)"
          value={data.kpis.donationsThisMonth.value}
          delta={data.kpis.donationsThisMonth.delta}
          sparkline={data.kpis.donationsThisMonth.sparkline}
          format={formatUsd}
        />
      </div>

      <UserGrowthChart data={data.userGrowth} />

      <div className="grid gap-4 lg:grid-cols-2">
        <EngagementBarChart data={data.engagementByContent} />
        <DonationDonutChart data={data.donationBreakdown} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-lg border border-border bg-card p-5 lg:col-span-3">
          <div className="pb-3">
            <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
            <p className="text-xs text-muted-foreground">What admins and the system did most recently</p>
          </div>
          <ul className="divide-y divide-border">
            {data.recentActivity.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 py-3">
                <Avatar className="size-8 shrink-0">
                  {entry.actorAvatarUrl && <AvatarImage src={entry.actorAvatarUrl} alt="" />}
                  <AvatarFallback>{initials(entry.actor)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{entry.actor}</span>{" "}
                    <span className="text-muted-foreground">{entry.action}</span>{" "}
                    <span>{entry.target}</span>
                  </p>
                  <span className="text-xs text-muted-foreground">{formatRelative(entry.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
          <div className="pb-3">
            <h2 className="text-sm font-semibold text-foreground">Upcoming events</h2>
            <p className="text-xs text-muted-foreground">Next 14 days</p>
          </div>
          <ul className="divide-y divide-border">
            {data.upcomingEvents.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{formatEventDate(e.startsAt)}</p>
                </div>
                <span className="shrink-0 rounded-sm bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                  {e.rsvpCount} RSVPs
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
