import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { CommentsClient } from "@/components/admin/comments/CommentsClient";
import { fetchAdminComments } from "@/lib/admin/data/comments";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("commentsAdmin");
  return { title: t("pageTitle") };
}

export default async function AdminCommentsPage() {
  const t = await getTranslations("commentsAdmin");
  const { comments } = await fetchAdminComments({ limit: 500 });
  return (
    <div>
      <PageHeader title={t("pageTitle")} subtitle={t("subtitle")} />
      <CommentsClient initialComments={comments} />
    </div>
  );
}
