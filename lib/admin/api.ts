import "server-only";
import { NextResponse } from "next/server";
import { getAdminSession, type AdminSession } from "@/lib/auth/session";

/**
 * Wraps an admin route handler with session + allowlist verification.
 * Returns 401 if not signed in, 403 if not on the allowlist.
 */
export async function requireAdmin(): Promise<
  | { ok: true; session: AdminSession }
  | { ok: false; response: NextResponse }
> {
  const session = await getAdminSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, session };
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "Not found"): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message: string, err?: unknown): NextResponse {
  if (err) console.error(message, err);
  return NextResponse.json({ error: message }, { status: 500 });
}
