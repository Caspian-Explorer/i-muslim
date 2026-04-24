export type AdminRole = "admin" | "moderator" | "scholar" | "member";

export type AdminUserStatus = "active" | "pending" | "suspended" | "banned";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: AdminRole;
  status: AdminUserStatus;
  verified: boolean;
  joinedAt: string; // ISO
  lastActiveAt: string; // ISO
}

export interface UserFilters {
  q?: string;
  role?: AdminRole;
  status?: AdminUserStatus;
  verified?: boolean;
}

export type NotificationType =
  | "signup"
  | "flagged"
  | "donation"
  | "qa"
  | "system";

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface ActivityEntry {
  id: string;
  actor: string;
  actorAvatarUrl: string | null;
  action: string;
  target: string;
  createdAt: string;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  startsAt: string;
  rsvpCount: number;
}

export interface DashboardData {
  kpis: {
    totalUsers: { value: number; delta: number; sparkline: number[] };
    activeThisWeek: { value: number; delta: number; sparkline: number[] };
    pendingApprovals: { value: number; delta: number; sparkline: number[] };
    donationsThisMonth: { value: number; delta: number; sparkline: number[] };
  };
  userGrowth: {
    "30": Array<{ date: string; users: number }>;
    "90": Array<{ date: string; users: number }>;
    "365": Array<{ date: string; users: number }>;
  };
  engagementByContent: Array<{ kind: string; value: number }>;
  donationBreakdown: Array<{ category: string; value: number }>;
  recentActivity: ActivityEntry[];
  upcomingEvents: UpcomingEvent[];
  source: "firestore" | "mock";
}
