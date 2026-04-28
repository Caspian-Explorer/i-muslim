"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getDb } from "@/lib/firebase/admin";
import {
  type FavoriteItemMeta,
  type FavoriteItemType,
  isFavoriteItemType,
} from "@/types/profile";

export type ToggleFavoriteResult =
  | { ok: true; favorited: boolean }
  | { ok: false; error: string };

export async function toggleFavoriteAction(
  idToken: string,
  payload: {
    itemType: FavoriteItemType;
    itemId: string;
    itemMeta: FavoriteItemMeta;
  },
): Promise<ToggleFavoriteResult> {
  if (!idToken) return { ok: false, error: "Sign in required" };
  if (!isFavoriteItemType(payload.itemType)) return { ok: false, error: "Bad item type" };
  if (!payload.itemId) return { ok: false, error: "Bad item id" };

  const auth = getAdminAuth();
  const db = getDb();
  if (!auth || !db) return { ok: false, error: "Firebase is not configured" };

  let decoded;
  try {
    decoded = await auth.verifyIdToken(idToken, true);
  } catch {
    return { ok: false, error: "Invalid sign-in token" };
  }
  if (!decoded.email_verified) return { ok: false, error: "Email not verified" };

  const col = db.collection("users").doc(decoded.uid).collection("favorites");

  try {
    const existing = await col
      .where("itemType", "==", payload.itemType)
      .where("itemId", "==", payload.itemId)
      .limit(1)
      .get();

    if (!existing.empty) {
      await existing.docs[0]!.ref.delete();
      revalidatePath("/profile/favorites");
      return { ok: true, favorited: false };
    }

    await col.add({
      itemType: payload.itemType,
      itemId: payload.itemId,
      itemMeta: {
        title: payload.itemMeta.title,
        subtitle: payload.itemMeta.subtitle ?? null,
        href: payload.itemMeta.href,
        thumbnail: payload.itemMeta.thumbnail ?? null,
        arabic: payload.itemMeta.arabic ?? null,
        locale: payload.itemMeta.locale ?? null,
      },
      createdAt: FieldValue.serverTimestamp(),
    });
    revalidatePath("/profile/favorites");
    return { ok: true, favorited: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Toggle failed";
    return { ok: false, error: message };
  }
}

export async function removeFavoriteAction(
  idToken: string,
  favoriteId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!idToken) return { ok: false, error: "Sign in required" };
  if (!favoriteId) return { ok: false, error: "Missing favorite id" };

  const auth = getAdminAuth();
  const db = getDb();
  if (!auth || !db) return { ok: false, error: "Firebase is not configured" };

  let decoded;
  try {
    decoded = await auth.verifyIdToken(idToken, true);
  } catch {
    return { ok: false, error: "Invalid sign-in token" };
  }

  try {
    await db
      .collection("users")
      .doc(decoded.uid)
      .collection("favorites")
      .doc(favoriteId)
      .delete();
    revalidatePath("/profile/favorites");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Remove failed";
    return { ok: false, error: message };
  }
}
