import { getTranslations } from "next-intl/server";
import { fetchPublishedMosques } from "@/lib/admin/data/mosques";
import { MosqueCard } from "@/components/mosque/MosqueCard";
import { HomeSection } from "./HomeSection";

export async function RecentMasjids() {
  const t = await getTranslations("home.recentMosques");
  const { mosques } = await fetchPublishedMosques({ limit: 200 });
  if (mosques.length === 0) return null;
  const recent = [...mosques]
    .sort((a, b) => {
      const aT = a.publishedAt ?? a.updatedAt ?? a.createdAt;
      const bT = b.publishedAt ?? b.updatedAt ?? b.createdAt;
      return new Date(bT).getTime() - new Date(aT).getTime();
    })
    .slice(0, 4);
  return (
    <HomeSection
      heading={t("heading")}
      subheading={t("subheading")}
      viewAllHref="/mosques"
      viewAllLabel={t("viewAll")}
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {recent.map((m) => (
          <li key={m.slug}>
            <MosqueCard mosque={m} />
          </li>
        ))}
      </ul>
    </HomeSection>
  );
}
