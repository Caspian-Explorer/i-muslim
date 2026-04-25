import { NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdmin, badRequest, serverError } from "@/lib/admin/api";
import { requireAdminAuth, requireDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const PatchSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    role: z.enum(["admin", "moderator", "scholar", "member"]).optional(),
    status: z.enum(["active", "pending", "suspended", "banned"]).optional(),
  })
  .strict();

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ uid: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { uid } = await ctx.params;
  if (!uid || uid.length > 200) return badRequest("Invalid uid");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const db = requireDb();
    const updates: Record<string, unknown> = {
      ...parsed.data,
      lastActiveAt: FieldValue.serverTimestamp(),
    };
    await db.collection("users").doc(uid).set(updates, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError("Failed to update user", err);
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ uid: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { uid } = await ctx.params;
  if (!uid || uid.length > 200) return badRequest("Invalid uid");

  if (uid === auth.session.uid) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 400 },
    );
  }

  try {
    const fbAuth = requireAdminAuth();
    const db = requireDb();
    await Promise.all([
      fbAuth.deleteUser(uid).catch(() => undefined),
      db.collection("users").doc(uid).delete(),
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError("Failed to delete user", err);
  }
}
