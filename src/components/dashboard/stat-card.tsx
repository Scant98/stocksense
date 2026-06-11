"use client";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { AnimatedNumber } from "@/components/magic/animated-number";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number;
  formatter?: (n: number) => string;
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

export function StatCard({ title, value, formatter, icon: Icon, change, changeLabel, accent = "primary", delay = 0 }: StatCardProps) {
  const colors = accentMap[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="rounded-xl border bg-card p-5 shadow-xs transition-shadow hover:shadow-md cursor-default"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold text-foreground tabular-nums">
            <AnimatedNumber value={value} formatter={formatter} duration={1000} />
          </p>
          {change !== undefined && (
            <p className={cn("mt-1 text-xs font-medium", colors.change)}>
              {change >= 0 ? "+" : ""}{change}%{" "}
              <span className="text-muted-foreground font-normal">{changeLabel ?? "vs last month"}</span>
            </p>
          )}
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg", colors.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
