import { getTranslations } from "next-intl/server";
import { Calculator, CalendarDays, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { HomeSection } from "./HomeSection";

export async function HomeTools() {
  const t = await getTranslations("home.tools");
  return (
    <HomeSection heading={t("heading")} subheading={t("subheading")}>
      <ul className="grid gap-4 sm:grid-cols-2">
        <li>
          <ToolCard
            href="/zakat"
            icon={<Calculator className="size-5" />}
            title={t("zakat.title")}
            description={t("zakat.description")}
            ctaLabel={t("openCta")}
          />
        </li>
        <li>
          <ToolCard
            href="/hijri-converter"
            icon={<CalendarDays className="size-5" />}
            title={t("hijri.title")}
            description={t("hijri.description")}
            ctaLabel={t("openCta")}
          />
        </li>
      </ul>
    </HomeSection>
  );
}

function ToolCard({
  href,
  icon,
  title,
  description,
  ctaLabel,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-background p-6 transition-colors hover:border-accent"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-selected text-selected-foreground">
          {icon}
        </span>
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-accent">
        {ctaLabel}
        <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
      </span>
    </Link>
  );
}
