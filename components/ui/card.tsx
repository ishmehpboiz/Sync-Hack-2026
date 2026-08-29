import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl bg-ink-5/70 backdrop-blur-xl border border-white/10 shadow-[0_8px_26px_rgba(15,15,15,0.24)]",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export { Card };
