"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "shimmer-btn text-white shadow-lg shadow-[rgba(99,102,241,0.3)]",
        outline: "border border-white/10 bg-white/5 text-foreground hover:bg-white/10",
        ghost: "text-[#9CA3AF] hover:bg-white/5 hover:text-white",
        danger: "bg-[#F43F5E] text-white hover:bg-[#F43F5E]/90",
        success: "bg-[#10B981] text-white hover:bg-[#10B981]/90",
        secondary: "bg-[#1a2234] border border-white/10 text-white hover:bg-[#1f2a40]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
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
      <motion.div whileTap={{ scale: 0.97 }} className="inline-flex">
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      </motion.div>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
