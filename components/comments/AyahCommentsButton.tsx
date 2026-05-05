"use client";

import { useTranslations } from "next-intl";
import { CommentsPopupButton } from "@/components/comments/CommentsPopupButton";
import type { CommentItemMeta } from "@/types/comments";

interface Props {
  surahId: number;
  ayahNumber: number;
  surahName: string;
  locale: string;
  signedIn: boolean;
  currentUid: string | null;
  initialCount: number;
  className?: string;
}

export function AyahCommentsButton({
  surahId,
  ayahNumber,
  surahName,
  locale,
  signedIn,
  currentUid,
  initialCount,
  className,
}: Props) {
  const t = useTranslations("comments");
  const verseKey = `${surahId}:${ayahNumber}`;
  const reference = `${surahName} ${verseKey}`;
  const itemMeta: CommentItemMeta = {
    title: reference,
    subtitle: null,
    href: `/quran/${surahId}#${verseKey}`,
    locale,
  };

  return (
    <CommentsPopupButton
      entityType="ayah"
      entityId={verseKey}
      itemMeta={itemMeta}
      signedIn={signedIn}
      currentUid={currentUid}
      initialCount={initialCount}
      dialogTitle={t("ayahDialogTitle", { reference })}
      triggerAriaLabel={t("ayahButtonAria", { count: initialCount })}
      className={className}
    />
  );
}
