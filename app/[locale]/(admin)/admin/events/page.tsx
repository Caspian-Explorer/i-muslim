import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { EventsPageClient } from "@/components/admin/events/EventsPageClient";
import { fetchEvents } from "@/lib/admin/data/events";
import { fetchEventCategories } from "@/lib/admin/data/event-categories";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("events");
  return { title: t("pageTitle") };
}

export default async function EventsPage() {
  const [{ events, source }, { categories }] = await Promise.all([
    fetchEvents(),
    fetchEventCategories(),
  ]);
  const t = await getTranslations("events");

  return (
    <div>
      <PageHeader title={t("pageTitle")} />
      <EventsPageClient initialEvents={events} source={source} categories={categories} />
    </div>
  );
}
