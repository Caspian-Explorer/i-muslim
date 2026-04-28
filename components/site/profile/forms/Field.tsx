import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

export function Field({
  label,
  children,
  error,
  span,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  span?: "full";
}) {
  return (
    <div className={span === "full" ? "space-y-1 sm:col-span-2" : "space-y-1"}>
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
