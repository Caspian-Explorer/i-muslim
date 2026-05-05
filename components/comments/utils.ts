import type { CommentReactionKind } from "@/types/comments";

export const REACTION_EMOJI: Record<CommentReactionKind, string> = {
  heart: "❤️",
  dua: "🤲",
  insightful: "💡",
};

const URL_RE = /(https?:\/\/[^\s<>()]+[^\s<>().,!?;:'"])/g;

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escapes the body and converts plain http/https URLs to <a> tags. Newlines
 * are preserved by the parent element's `white-space: pre-wrap`. Output is
 * safe to feed into dangerouslySetInnerHTML — the only HTML we emit are the
 * <a> tags we ourselves construct, with escaped href values.
 */
export function linkifyComment(body: string): string {
  return escape(body).replace(URL_RE, (raw) => {
    const url = raw;
    return `<a href="${url}" target="_blank" rel="noopener noreferrer nofollow">${url}</a>`;
  });
}
