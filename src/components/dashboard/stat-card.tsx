"use client";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { AnimatedNumber } from "@/components/magic/animated-number";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number;
  formatter?: (n: number) => string;
  /** Shorter format used below the `sm` breakpoint so big amounts fit narrow cards. */
  compactFormatter?: (n: number) => string;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  accent?: "primary" | "success" | "warning" | "danger";
  delay?: number;
}

const accentMap = {
  primary: {
    icon: "bg-primary/15 text-primary",
    change: "text-primary",
  },
  success: {
    icon: "bg-success/15 text-success",
    change: "text-success",
  },
  warning: {
    icon: "bg-warning/15 text-warning",
    change: "text-warning",
  },
  danger: {
    icon: "bg-destructive/15 text-destructive",
    change: "text-destructive",
  },
};

export function StatCard({ title, value, formatter, compactFormatter, icon: Icon, change, changeLabel, accent = "primary", delay = 0 }: StatCardProps) {
  const colors = accentMap[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="min-w-0 rounded-xl border bg-card p-3.5 shadow-xs transition-shadow hover:shadow-md cursor-default sm:p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase leading-snug tracking-wider text-muted-foreground sm:text-xs">{title}</p>
          <p className="mt-1.5 text-xl font-bold leading-tight text-foreground tabular-nums sm:mt-2 sm:text-2xl">
            {compactFormatter ? (
              <>
                <AnimatedNumber value={value} formatter={compactFormatter} duration={1000} className="sm:hidden" />
                <AnimatedNumber value={value} formatter={formatter} duration={1000} className="hidden sm:inline" />
              </>
            ) : (
              <AnimatedNumber value={value} formatter={formatter} duration={1000} className="break-words" />
            )}
          </p>
          {change !== undefined && (
            <p className={cn("mt-1 text-xs font-medium", colors.change)}>
              {change >= 0 ? "+" : ""}{change}%{" "}
              <span className="text-muted-foreground font-normal">{changeLabel ?? "vs last month"}</span>
            </p>
          )}
        </div>
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11", colors.icon)}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </motion.div>
  );
}
