import { NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdmin, badRequest, serverError } from "@/lib/admin/api";
import { requireAdminAuth, requireDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const InviteSchema = z
  .object({
    name: z.string().min(2).max(120),
    email: z.string().email().max(320),
    role: z.enum(["admin", "moderator", "scholar", "member"]),
  })
  .strict();

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }
  const parsed = InviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { name, email, role } = parsed.data;

  try {
    const fbAuth = requireAdminAuth();
    const db = requireDb();

    // Look up first; if exists, just upsert the Firestore profile.
    let uid: string;
    try {
      const existing = await fbAuth.getUserByEmail(email);
      uid = existing.uid;
    } catch {
      const created = await fbAuth.createUser({
        email,
        displayName: name,
        emailVerified: false,
        disabled: false,
      });
      uid = created.uid;
    }

    const now = FieldValue.serverTimestamp();
    await db.collection("users").doc(uid).set(
      {
        id: uid,
        name,
        email,
        role,
        status: "pending",
        verified: false,
        joinedAt: now,
        lastActiveAt: now,
      },
      { merge: true },
    );

    return NextResponse.json({
      ok: true,
      user: {
        id: uid,
        name,
        email,
        role,
        status: "pending",
        verified: false,
        avatarUrl: null,
        joinedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    return serverError("Failed to invite user", err);
  }
}
