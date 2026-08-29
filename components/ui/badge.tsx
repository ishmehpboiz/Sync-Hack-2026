import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[9px] font-medium uppercase tracking-[0.1em]",
  {
    variants: {
      variant: {
        solid: "bg-ink-900 text-ink-10",
        outline: "border border-ink-950/22 text-ink-950/68",
        dashed: "border border-dashed border-ink-950/18 text-ink-950/32",
      },
    },
    defaultVariants: { variant: "outline" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
