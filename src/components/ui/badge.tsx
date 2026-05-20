import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "muted" | "primary";
}

export function Badge({ className, variant = "muted", children, ...props }: BadgeProps) {
  const variantClasses = {
    success: "bg-[rgba(16,185,129,0.15)] text-[#10B981] border-[rgba(16,185,129,0.2)]",
    warning: "bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border-[rgba(245,158,11,0.2)]",
    danger: "bg-[rgba(244,63,94,0.15)] text-[#F43F5E] border-[rgba(244,63,94,0.2)]",
    primary: "bg-[rgba(99,102,241,0.15)] text-[#818CF8] border-[rgba(99,102,241,0.2)]",
    muted: "bg-white/5 text-[#9CA3AF] border-white/10",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
