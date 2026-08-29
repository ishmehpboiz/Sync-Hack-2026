import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-ink-5/96 backdrop-blur-md border border-ink-950/14 shadow-[0_8px_26px_rgba(15,15,15,0.08)]",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export { Card };
