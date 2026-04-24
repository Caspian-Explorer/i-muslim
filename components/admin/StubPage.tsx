import { FileQuestion } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { PageHeader } from "./PageHeader";
import { findNavItem } from "@/lib/admin/nav";

interface StubPageProps {
  href: string;
  description?: string;
}

export function StubPage({
  href,
  description = "This section is coming soon. Phase 1 ships the Dashboard and Users; the rest follows as the app grows.",
}: StubPageProps) {
  const item = findNavItem(href);
  const Icon = item?.icon ?? FileQuestion;
  const title = item?.label ?? "Coming soon";

  return (
    <div>
      <PageHeader title={title} />
      <EmptyState icon={Icon} title="Coming soon" description={description} />
    </div>
  );
}
