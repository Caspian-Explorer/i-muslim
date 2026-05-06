import { getTranslations } from "next-intl/server";
import { listPublished } from "@/lib/businesses/public";
import {
  fetchCategories,
  fetchCertBodies,
} from "@/lib/admin/data/business-taxonomies";
import { BusinessCard } from "@/components/businesses/BusinessCard";
import { HomeSection } from "./HomeSection";

export async function RecentBusinesses() {
  const t = await getTranslations("home.recentBusinesses");
  const [{ businesses }, { categories }, { certBodies }] = await Promise.all([
    listPublished({ limit: 200 }),
    fetchCategories(),
    fetchCertBodies(),
  ]);
  if (businesses.length === 0) return null;
  const recent = [...businesses]
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
      viewAllHref="/businesses"
      viewAllLabel={t("viewAll")}
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {recent.map((b) => (
          <li key={b.id}>
            <BusinessCard
              business={b}
              categories={categories}
              certBodies={certBodies}
            />
          </li>
        ))}
      </ul>
    </HomeSection>
  );
}
