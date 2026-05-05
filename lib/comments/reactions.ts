import "server-only";
import { getDb } from "@/lib/firebase/admin";
import { COMMENTS_COLLECTION } from "@/lib/comments/data";
import { isReactionKind, type CommentReactionKind } from "@/types/comments";

/**
 * Returns a map of commentId -> the user's currently selected reaction kind
 * (if any). Used to highlight the active emoji in the public reactions row.
 *
 * Firestore caps `where in` at 30 ids, so we chunk if necessary.
 */
export async function getUserReactionsForComments(
  uid: string,
  commentIds: string[],
): Promise<Map<string, CommentReactionKind>> {
  const out = new Map<string, CommentReactionKind>();
  if (!uid || commentIds.length === 0) return out;
  const db = getDb();
  if (!db) return out;

  const unique = Array.from(new Set(commentIds));
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += 30) {
    chunks.push(unique.slice(i, i + 30));
  }

  try {
    await Promise.all(
      chunks.map(async (chunk) => {
        const refs = chunk.map((id) =>
          db.collection(COMMENTS_COLLECTION).doc(id).collection("reactions").doc(uid),
        );
        const snaps = await db.getAll(...refs);
        snaps.forEach((snap, idx) => {
          if (!snap.exists) return;
          const data = snap.data() ?? {};
          const kind = data.kind;
          if (isReactionKind(kind)) {
            out.set(chunk[idx]!, kind);
          }
        });
      }),
    );
    return out;
  } catch (err) {
    console.warn("[comments/reactions] getUserReactionsForComments failed:", err);
    return out;
  }
}
