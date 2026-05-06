import { Suspense } from "react";
import { HomeHero } from "@/components/home/HomeHero";
import { HomePrayerTimes } from "@/components/home/HomePrayerTimes";
import { AyahOfTheDay } from "@/components/home/AyahOfTheDay";
import { HadithOfTheDay } from "@/components/home/HadithOfTheDay";
import { RecentMasjids } from "@/components/home/RecentMasjids";
import { RecentBusinesses } from "@/components/home/RecentBusinesses";
import { HomeEventsThisWeek } from "@/components/home/HomeEventsThisWeek";
import { HomeTools } from "@/components/home/HomeTools";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <HomeHero />

      <div className="mt-10">
        <HomePrayerTimes />
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <Suspense fallback={null}>
          <AyahOfTheDay />
        </Suspense>
        <Suspense fallback={null}>
          <HadithOfTheDay />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <RecentMasjids />
      </Suspense>

      <Suspense fallback={null}>
        <RecentBusinesses />
      </Suspense>

      <Suspense fallback={null}>
        <HomeEventsThisWeek />
      </Suspense>

      <HomeTools />
    </div>
  );
}
