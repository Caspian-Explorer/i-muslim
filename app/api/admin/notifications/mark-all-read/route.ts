import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/api";
import { markAllNotificationsRead } from "@/lib/admin/data/notifications";

export const runtime = "nodejs";

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const count = await markAllNotificationsRead();
  return NextResponse.json({ ok: true, count });
}
