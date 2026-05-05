import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NotificationsListClient } from "@/components/admin/NotificationsListClient";
import { fetchNotifications } from "@/lib/admin/data/notifications";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notifications.page");
  return { title: t("title") };
}

export default async function AdminNotificationsPage() {
  const { items, source } = await fetchNotifications({ limit: 200 });
  return (
    <NotificationsListClient
      initialItems={items}
      canPersist={source === "firestore"}
    />
  );
}
