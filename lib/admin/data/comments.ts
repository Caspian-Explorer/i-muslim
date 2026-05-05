import "server-only";
import { getDb } from "@/lib/firebase/admin";
import { COMMENTS_COLLECTION, normalizeComment } from "@/lib/comments/data";
import type { CommentEntityType, CommentRecord, CommentStatus } from "@/types/comments";

export interface FetchAdminCommentsOpts {
  limit?: number;
  status?: CommentStatus | "all";
  entityType?: CommentEntityType | "all";
}

export interface AdminCommentsResult {
  comments: CommentRecord[];
}

/**
 * Fetches comments for the admin moderation page. We pull a wide window
 * (default 500) ordered by updatedAt desc and let the client filter/search
 * in-memory — the same approach used by the contact messages admin.
 */
export async function fetchAdminComments(
  opts: FetchAdminCommentsOpts = {},
): Promise<AdminCommentsResult> {
  const db = getDb();
  if (!db) return { comments: [] };

  const limit = Math.max(1, Math.min(1000, opts.limit ?? 500));

  try {
    let q = db.collection(COMMENTS_COLLECTION) as FirebaseFirestore.Query;
    if (opts.status && opts.status !== "all") {
      q = q.where("status", "==", opts.status);
    }
    if (opts.entityType && opts.entityType !== "all") {
      q = q.where("entityType", "==", opts.entityType);
    }
    const snap = await q.orderBy("updatedAt", "desc").limit(limit).get();
    const comments = snap.docs
      .map((d) => normalizeComment(d.id, d.data() as Record<string, unknown>))
      .filter((c): c is CommentRecord => c !== null);
    return { comments };
  } catch (err) {
    console.warn("[admin/data/comments] fetch failed:", err);
    return { comments: [] };
  }
}

export async function countAutoHiddenComments(): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  try {
    const snap = await db
      .collection(COMMENTS_COLLECTION)
      .where("status", "==", "auto_hidden")
      .count()
      .get();
    return snap.data().count;
  } catch (err) {
    console.warn("[admin/data/comments] count failed:", err);
    return 0;
  }
}
