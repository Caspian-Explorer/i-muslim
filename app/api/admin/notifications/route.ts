import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/api";
import { fetchNotifications } from "@/lib/admin/data/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { items, source } = await fetchNotifications({ limit: 50 });
  return NextResponse.json({ items, source });
}
