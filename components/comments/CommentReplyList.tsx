"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { CommentItem } from "@/components/comments/CommentItem";
import {
  COMMENTS_PAGE_SIZE,
  isReactionKind,
  type CommentEntityType,
  type CommentItemMeta,
  type CommentReactionKind,
  type CommentRecord,
} from "@/types/comments";

interface Props {
  entityType: CommentEntityType;
  entityId: string;
  parentId: string;
  itemMeta: CommentItemMeta;
  currentUid: string | null;
  signedIn: boolean;
  /**
   * Replies the user just posted in this session, owned by the parent
   * CommentItem. Rendered immediately at the top of the list (deduped by id
   * against the fetched page) so a freshly-posted reply is visible without
   * relying on the API roundtrip — the previous window-event mechanism lost
   * the new reply because this list mounts AFTER the event fires.
   */
  seedReplies?: CommentRecord[];
  onSignInRequired: () => void;
  onFlag: (commentId: string) => void;
}

interface ApiResponse {
  comments: CommentRecord[];
  hasMore: boolean;
  page: number;
  pageSize: number;
  userReactions: Record<string, string>;
}

export function CommentReplyList({
  entityType,
  entityId,
  parentId,
  itemMeta,
  currentUid,
  signedIn,
  seedReplies,
  onSignInRequired,
  onFlag,
}: Props) {
  const t = useTranslations("comments");
  const tActions = useTranslations("comments.actions");
  const [replies, setReplies] = useState<CommentRecord[]>([]);
  const [reactionMap, setReactionMap] = useState<Map<string, CommentReactionKind>>(
    new Map(),
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(
    async (nextPage: number) => {
      const url = new URL("/api/comments", window.location.origin);
      url.searchParams.set("entityType", entityType);
      url.searchParams.set("entityId", entityId);
      url.searchParams.set("parentId", parentId);
      url.searchParams.set("page", String(nextPage));
      url.searchParams.set("pageSize", String(COMMENTS_PAGE_SIZE));
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      return (await res.json()) as ApiResponse;
    },
    [entityType, entityId, parentId],
  );

  // Initial load. `loading` is already `true` initially, so we only need to
  // clear it once the fetch resolves — no setLoading(true) inside the effect,
  // which would trip react-hooks/set-state-in-effect.
  useEffect(() => {
    let cancelled = false;
    fetchPage(1)
      .then((data) => {
        if (cancelled) return;
        setReplies(data.comments);
        setHasMore(data.hasMore);
        setPage(1);
        const map = new Map<string, CommentReactionKind>();
        for (const [id, kind] of Object.entries(data.userReactions)) {
          if (isReactionKind(kind)) map.set(id, kind);
        }
        setReactionMap(map);
      })
      .catch(() => {
        if (!cancelled) toast.error(t("errors.loadFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchPage, t]);

  // Keep the user's selected reaction-kind highlight in sync across mounts.
  // Optimistic-reply injection is handled by the `seedReplies` prop instead
  // of a window event (the event fired before this component mounted, so its
  // listener was attached too late and the freshly-posted reply was lost).
  useEffect(() => {
    function onUserKind(e: Event) {
      const ev = e as CustomEvent<{ id: string; kind: CommentReactionKind | null }>;
      setReactionMap((prev) => {
        const next = new Map(prev);
        if (ev.detail.kind) next.set(ev.detail.id, ev.detail.kind);
        else next.delete(ev.detail.id);
        return next;
      });
    }
    window.addEventListener("comments:user-kind", onUserKind);
    return () => {
      window.removeEventListener("comments:user-kind", onUserKind);
    };
  }, []);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const data = await fetchPage(next);
      setReplies((prev) => [...prev, ...data.comments]);
      setHasMore(data.hasMore);
      setPage(next);
      setReactionMap((prev) => {
        const map = new Map(prev);
        for (const [id, kind] of Object.entries(data.userReactions)) {
          if (isReactionKind(kind)) map.set(id, kind);
        }
        return map;
      });
    } catch {
      toast.error(t("errors.loadFailed"));
    } finally {
      setLoadingMore(false);
    }
  }

  function updateReply(next: CommentRecord) {
    setReplies((prev) => prev.map((r) => (r.id === next.id ? next : r)));
  }

  // Seeded replies (just posted in this session) are rendered first; the
  // fetched page follows, with anything already present in the seed list
  // filtered out so the same reply can't render twice.
  const merged = useMemo(() => {
    const seeds = seedReplies ?? [];
    if (seeds.length === 0) return replies;
    const seedIds = new Set(seeds.map((r) => r.id));
    return [...seeds, ...replies.filter((r) => !seedIds.has(r.id))];
  }, [seedReplies, replies]);

  if (loading && merged.length === 0) {
    return <div className="py-3 text-xs text-muted-foreground">{t("loading")}</div>;
  }

  if (merged.length === 0) {
    return null;
  }

  return (
    <div className="comment-thread">
      {merged.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          entityType={entityType}
          entityId={entityId}
          itemMeta={itemMeta}
          currentUid={currentUid}
          signedIn={signedIn}
          userKind={reactionMap.get(reply.id) ?? null}
          allowReplies={false}
          onUpdate={(next) => {
            updateReply(next);
          }}
          onSignInRequired={onSignInRequired}
          onFlag={onFlag}
        />
      ))}
      {hasMore && (
        <Button size="sm" variant="ghost" onClick={loadMore} disabled={loadingMore}>
          {tActions("loadMore")}
        </Button>
      )}
    </div>
  );
}
