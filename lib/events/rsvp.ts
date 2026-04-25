"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getDb } from "@/lib/firebase/admin";

export type RsvpResult =
  | { ok: true; rsvped: boolean; rsvpCount: number }
  | { ok: false; error: string };

export async function rsvpToggleAction(
  eventId: string,
  idToken: string,
): Promise<RsvpResult> {
  if (!eventId) return { ok: false, error: "Missing event id" };
  if (!idToken) return { ok: false, error: "Sign in required" };

  const auth = getAdminAuth();
  const db = getDb();
  if (!auth || !db) {
    return { ok: false, error: "Firebase is not configured" };
  }

  let decoded;
  try {
    decoded = await auth.verifyIdToken(idToken, true);
  } catch {
    return { ok: false, error: "Invalid sign-in token" };
  }
  if (!decoded.email_verified) {
    return { ok: false, error: "Email not verified" };
  }

  const eventRef = db.collection("events").doc(eventId);
  const rsvpRef = eventRef.collection("rsvps").doc(decoded.uid);

  try {
    const result = await db.runTransaction(async (tx) => {
      const eventSnap = await tx.get(eventRef);
      if (!eventSnap.exists) throw new Error("Event not found");
      const data = eventSnap.data() ?? {};
      const status = typeof data.status === "string" ? data.status : "draft";
      if (status !== "published") throw new Error("Event not published");

      const capacity =
        typeof data.capacity === "number" && Number.isFinite(data.capacity)
          ? data.capacity
          : null;
      const currentCount =
        typeof data.rsvpCount === "number" && Number.isFinite(data.rsvpCount)
          ? data.rsvpCount
          : 0;

      const rsvpSnap = await tx.get(rsvpRef);
      const isRsvped = rsvpSnap.exists;

      if (isRsvped) {
        tx.delete(rsvpRef);
        tx.update(eventRef, { rsvpCount: FieldValue.increment(-1) });
        return { rsvped: false, rsvpCount: Math.max(0, currentCount - 1) };
      }

      if (capacity != null && currentCount >= capacity) {
        throw new Error("Event is full");
      }

      tx.set(rsvpRef, {
        uid: decoded.uid,
        email: decoded.email ?? null,
        name: (decoded.name as string | undefined) ?? null,
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.update(eventRef, { rsvpCount: FieldValue.increment(1) });
      return { rsvped: true, rsvpCount: currentCount + 1 };
    });

    revalidatePath(`/events/${eventId}`);
    revalidatePath("/events");
    revalidatePath("/admin/events");
    return { ok: true, rsvped: result.rsvped, rsvpCount: result.rsvpCount };
  } catch (err) {
    const message = err instanceof Error ? err.message : "RSVP failed";
    return { ok: false, error: message };
  }
}

export async function fetchRsvpStatus(
  eventId: string,
  idToken: string,
): Promise<{ rsvped: boolean }> {
  const auth = getAdminAuth();
  const db = getDb();
  if (!auth || !db || !idToken) return { rsvped: false };
  try {
    const decoded = await auth.verifyIdToken(idToken, true);
    const snap = await db
      .collection("events")
      .doc(eventId)
      .collection("rsvps")
      .doc(decoded.uid)
      .get();
    return { rsvped: snap.exists };
  } catch {
    return { rsvped: false };
  }
}
