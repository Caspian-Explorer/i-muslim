import "server-only";
import { getDb } from "@/lib/firebase/admin";
import { buildMockDashboard } from "@/lib/admin/mock/dashboard";
import type { DashboardData } from "@/types/admin";

export async function fetchDashboard(): Promise<DashboardData> {
  const mock = buildMockDashboard();
  const db = getDb();
  if (!db) return mock;

  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [totalSnap, activeSnap, pendingSnap, donationsSnap] = await Promise.all([
      db.collection("users").count().get().catch(() => null),
      db
        .collection("users")
        .where("lastActiveAt", ">=", oneWeekAgo)
        .count()
        .get()
        .catch(() => null),
      db
        .collection("users")
        .where("status", "==", "pending")
        .count()
        .get()
        .catch(() => null),
      db
        .collection("donations")
        .where("createdAt", ">=", new Date(new Date().setDate(1)))
        .count()
        .get()
        .catch(() => null),
    ]);

    const kpis = { ...mock.kpis };
    if (totalSnap) kpis.totalUsers = { ...kpis.totalUsers, value: totalSnap.data().count };
    if (activeSnap) kpis.activeThisWeek = { ...kpis.activeThisWeek, value: activeSnap.data().count };
    if (pendingSnap) kpis.pendingApprovals = { ...kpis.pendingApprovals, value: pendingSnap.data().count };
    if (donationsSnap) kpis.donationsThisMonth = {
      ...kpis.donationsThisMonth,
      value: donationsSnap.data().count,
    };

    const touchedFirestore = Boolean(totalSnap || activeSnap || pendingSnap || donationsSnap);
    return { ...mock, kpis, source: touchedFirestore ? "firestore" : "mock" };
  } catch (err) {
    console.warn("[admin/data/dashboard] Firestore read failed, using mock:", err);
    return mock;
  }
}
