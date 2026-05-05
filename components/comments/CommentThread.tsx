import { getTranslations } from "next-intl/server";
import { getSiteSession } from "@/lib/auth/session";
import { listComments } from "@/lib/comments/data";
import { getUserReactionsForComments } from "@/lib/comments/reactions";
import {
  COMMENTS_PAGE_SIZE,
  type CommentEntityType,
  type CommentItemMeta,
  type CommentReactionKind,
} from "@/types/comments";
import { CommentList } from "@/components/comments/CommentList";

interface Props {
  entityType: CommentEntityType;
  entityId: string;
  itemMeta: CommentItemMeta;
  /** Render only the list (no surrounding heading or container). Used inside the ayah popup. */
  bare?: boolean;
}

/**
 * Server component that fetches the first page of comments for an entity and
 * renders the interactive client list. Drop into any detail page that should
 * have inline comments (article / mosque / surah / hadith / event / business).
 */
export async function CommentThread({ entityType, entityId, itemMeta, bare }: Props) {
  const t = await getTranslations("comments");
  const session = await getSiteSession();

  const result = await listComments({
    entityType,
    entityId,
    parentId: null,
    pageSize: COMMENTS_PAGE_SIZE,
  });

  let userReactions: Record<string, CommentReactionKind> = {};
  if (session && result.comments.length) {
    const map = await getUserReactionsForComments(
      session.uid,
      result.comments.map((c) => c.id),
    );
    userReactions = Object.fromEntries(map.entries());
  }

  const list = (
    <CommentList
      entityType={entityType}
      entityId={entityId}
      itemMeta={itemMeta}
      initialComments={result.comments}
      initialHasMore={result.hasMore}
      initialUserReactions={userReactions}
      signedIn={!!session}
      currentUid={session?.uid ?? null}
    />
  );

  if (bare) return list;

  return (
    <section
      aria-labelledby={`comments-heading-${entityType}-${entityId}`}
      className="mt-10 border-t border-border pt-6"
    >
      <h2
        id={`comments-heading-${entityType}-${entityId}`}
        className="text-lg font-semibold text-foreground"
      >
        {t("title")}
      </h2>
      <div className="mt-4">{list}</div>
    </section>
  );
}
