import "server-only";
import { getDb } from "@/lib/firebase/admin";
import { MOCK_USERS } from "@/lib/admin/mock/users";
import type { AdminUser, AdminRole, AdminUserStatus } from "@/types/admin";

export type UsersResult = {
  users: AdminUser[];
  source: "firestore" | "mock";
};

function normalize(id: string, raw: Record<string, unknown>): AdminUser | null {
  if (!raw) return null;
  const email = typeof raw.email === "string" ? raw.email : "";
  const name =
    typeof raw.name === "string"
      ? raw.name
      : typeof raw.displayName === "string"
        ? raw.displayName
        : email.split("@")[0] ?? "Unknown";

  const role = (raw.role as AdminRole) ?? "member";
  const status = (raw.status as AdminUserStatus) ?? "active";
  const verified = Boolean(raw.verified ?? raw.emailVerified ?? false);

  const asIso = (v: unknown): string => {
    if (!v) return new Date().toISOString();
    if (typeof v === "string") return v;
    if (typeof v === "object" && v && "toDate" in v && typeof (v as { toDate: () => Date }).toDate === "function") {
      return (v as { toDate: () => Date }).toDate().toISOString();
    }
    if (v instanceof Date) return v.toISOString();
    return new Date().toISOString();
  };

  return {
    id,
    name,
    email,
    avatarUrl: (raw.avatarUrl as string | null) ?? (raw.photoURL as string | null) ?? null,
    role,
    status,
    verified,
    joinedAt: asIso(raw.joinedAt ?? raw.createdAt),
    lastActiveAt: asIso(raw.lastActiveAt ?? raw.updatedAt ?? raw.createdAt),
  };
}

export async function fetchUsers(): Promise<UsersResult> {
  const db = getDb();
  if (!db) return { users: MOCK_USERS, source: "mock" };

  try {
    const snap = await db.collection("users").limit(500).get();
    if (snap.empty) return { users: MOCK_USERS, source: "mock" };
    const users = snap.docs
      .map((d) => normalize(d.id, d.data() as Record<string, unknown>))
      .filter((u): u is AdminUser => u !== null);
    return { users, source: "firestore" };
  } catch (err) {
    console.warn("[admin/data/users] Firestore read failed, falling back to mock:", err);
    return { users: MOCK_USERS, source: "mock" };
  }
}
