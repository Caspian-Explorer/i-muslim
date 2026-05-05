"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { setReactionAction } from "@/app/[locale]/(site)/comments-actions";
import { toast } from "@/components/ui/sonner";
import { REACTION_KINDS, type CommentReactionCounts, type CommentReactionKind } from "@/types/comments";
import { REACTION_EMOJI } from "@/components/comments/utils";
import { cn } from "@/lib/utils";

interface Props {
  commentId: string;
  reactions: CommentReactionCounts;
  userKind: CommentReactionKind | null;
  signedIn: boolean;
  onChange: (next: { reactions: CommentReactionCounts; userKind: CommentReactionKind | null }) => void;
  onSignInRequired: () => void;
}

export function CommentReactions({
  commentId,
  reactions,
  userKind,
  signedIn,
  onChange,
  onSignInRequired,
}: Props) {
  const [pending, startTransition] = useTransition();
  const t = useTranslations("comments");
  const tCommon = useTranslations("comments.reactions");

  function toggle(kind: CommentReactionKind) {
    if (!signedIn) {
      onSignInRequired();
      return;
    }
    const next = userKind === kind ? null : kind;

    // Optimistic update
    const previous = { reactions, userKind };
    const nextCounts: CommentReactionCounts = {
      heart: reactions.heart,
      dua: reactions.dua,
      insightful: reactions.insightful,
    };
    if (userKind && nextCounts[userKind] > 0) nextCounts[userKind] -= 1;
    if (next) nextCounts[next] += 1;
    onChange({ reactions: nextCounts, userKind: next });

    startTransition(async () => {
      const r = await setReactionAction({ commentId, kind: next });
      if (!r.ok) {
        onChange(previous);
        if (r.reason === "unauthorized") onSignInRequired();
        else toast.error(t("errors.reactionFailed"));
        return;
      }
      onChange({ reactions: r.reactions, userKind: r.userKind });
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      {REACTION_KINDS.map((kind) => {
        const count = reactions[kind];
        const active = userKind === kind;
        return (
          <button
            key={kind}
            type="button"
            disabled={pending}
            onClick={() => toggle(kind)}
            aria-pressed={active}
            aria-label={tCommon(kind)}
            title={tCommon(kind)}
            className={cn("comment-reaction-pill", active && "is-active")}
          >
            <span aria-hidden>{REACTION_EMOJI[kind]}</span>
            {count > 0 && <span className="tabular-nums">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
