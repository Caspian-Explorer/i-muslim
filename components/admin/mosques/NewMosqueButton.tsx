"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openQuickCreate } from "@/components/admin/QuickCreate";

export function NewMosqueButton({ label }: { label: string }) {
  return (
    <Button size="sm" onClick={() => openQuickCreate("mosque")}>
      <Plus /> {label}
    </Button>
  );
}
