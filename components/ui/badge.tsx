import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
  {
    variants: {
      variant: {
        neutral:
          "border-border bg-muted text-muted-foreground",
        success:
          "border-transparent bg-success/10 text-success dark:text-success-foreground",
        warning:
          "border-transparent bg-warning/10 text-warning dark:text-warning-foreground",
        danger:
          "border-transparent bg-danger/10 text-danger dark:text-danger-foreground",
        info:
          "border-transparent bg-[color:var(--chart-2)]/10 text-[color:var(--chart-2)]",
        accent:
          "border-transparent bg-sidebar-accent text-sidebar-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
