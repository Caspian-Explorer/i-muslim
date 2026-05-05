import "server-only";
import { getDb } from "@/lib/firebase/admin";
import { COMMENTS_COLLECTION, normalizeComment } from "@/lib/comments/data";
import type { CommentRecord } from "@/types/comments";

export interface ListMyCommentsOpts {
  limit?: number;
}

/**
 * Returns the signed-in user's own comments (any status, including
 * auto_hidden / hidden / deleted) ordered by createdAt desc.
 */
export async function listMyComments(
  uid: string,
  opts: ListMyCommentsOpts = {},
): Promise<CommentRecord[]> {
  if (!uid) return [];
  const db = getDb();
  if (!db) return [];
  const limit = Math.max(1, Math.min(500, opts.limit ?? 100));
  try {
    const snap = await db
      .collection(COMMENTS_COLLECTION)
      .where("author.uid", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    return snap.docs
      .map((d) => normalizeComment(d.id, d.data() as Record<string, unknown>))
      .filter((c): c is CommentRecord => c !== null);
  } catch (err) {
    console.warn("[profile/comments] listMyComments failed:", err);
    return [];
  }
}
