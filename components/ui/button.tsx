import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-mono text-[10px] font-medium uppercase tracking-[0.1em] transition-colors disabled:pointer-events-none disabled:opacity-50 min-h-[44px]",
  {
    variants: {
      variant: {
        primary: "bg-ink-900 text-ink-10 hover:bg-ink-950",
        ghost: "bg-transparent text-ink-950/60 hover:text-ink-950 underline",
        outline:
          "border border-ink-950/20 bg-transparent text-ink-950/70 hover:border-ink-950/40",
      },
      size: {
        default: "px-4 py-2.5",
        lg: "px-7 py-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
