import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { ReactNode } from "react";

interface Props {
  heading: string;
  subheading?: string | null;
  viewAllHref?: string;
  viewAllLabel?: string;
  children: ReactNode;
}

export function HomeSection({
  heading,
  subheading,
  viewAllHref,
  viewAllLabel,
  children,
}: Props) {
  return (
    <section className="mt-16">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {heading}
          </h2>
          {subheading && (
            <p className="mt-1 text-sm text-muted-foreground">{subheading}</p>
          )}
        </div>
        {viewAllHref && viewAllLabel && (
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {viewAllLabel}
            <ArrowRight className="size-3.5 rtl:rotate-180" />
          </Link>
        )}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
