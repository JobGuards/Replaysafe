import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-acid-lime/50",
  {
    variants: {
      variant: {
        default:
          "bg-acid-lime text-primary-foreground hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-acid-lime/20",
        destructive: "bg-red-500 text-white hover:bg-red-500/90",
        outline:
          "border-2 border-border bg-transparent text-foreground hover:bg-foreground/5 hover:border-foreground/20",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-foreground/5 hover:text-foreground",
        link: "text-acid-lime underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-8",
        sm: "h-10 rounded-lg px-4",
        lg: "h-14 rounded-2xl px-10 text-sm",
        icon: "size-12 rounded-xl",
        "icon-sm": "size-10 rounded-lg",
        "icon-lg": "size-14 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
