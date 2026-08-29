import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-lg px-4 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] border border-white/15 bg-white/5 backdrop-blur-md text-ink-950/62 transition-colors data-[state=on]:bg-ink-900 data-[state=on]:text-ink-10 data-[state=on]:border-ink-900"
);

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, ...props }, ref) => (
  <TogglePrimitive.Root ref={ref} className={cn(toggleVariants(), className)} {...props} />
));
Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
