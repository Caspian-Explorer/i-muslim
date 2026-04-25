import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/session";
import { seedBusinessesDirectory } from "@/lib/businesses/seed";

export const runtime = "nodejs";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Disabled in production" }, { status: 403 });
  }
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await seedBusinessesDirectory();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Seed failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
