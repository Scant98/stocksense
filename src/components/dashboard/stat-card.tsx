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
    icon: "bg-[rgba(99,102,241,0.15)] text-[#818CF8]",
    glow: "hover:shadow-[0_0_40px_rgba(99,102,241,0.15)]",
    change: "text-[#818CF8]",
  },
  success: {
    icon: "bg-[rgba(16,185,129,0.15)] text-[#10B981]",
    glow: "hover:shadow-[0_0_40px_rgba(16,185,129,0.15)]",
    change: "text-[#10B981]",
  },
  warning: {
    icon: "bg-[rgba(245,158,11,0.15)] text-[#F59E0B]",
    glow: "hover:shadow-[0_0_40px_rgba(245,158,11,0.15)]",
    change: "text-[#F59E0B]",
  },
  danger: {
    icon: "bg-[rgba(244,63,94,0.15)] text-[#F43F5E]",
    glow: "hover:shadow-[0_0_40px_rgba(244,63,94,0.15)]",
    change: "text-[#F43F5E]",
  },
};

export function StatCard({ title, value, formatter, icon: Icon, change, changeLabel, accent = "primary", delay = 0 }: StatCardProps) {
  const colors = accentMap[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={cn(
        "glass rounded-2xl p-5 transition-shadow cursor-default",
        colors.glow
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">{title}</p>
          <p className="mt-2 text-2xl font-bold text-white">
            <AnimatedNumber value={value} formatter={formatter} duration={1000} />
          </p>
          {change !== undefined && (
            <p className={cn("mt-1 text-xs font-medium", colors.change)}>
              {change >= 0 ? "+" : ""}{change}%{" "}
              <span className="text-[#9CA3AF] font-normal">{changeLabel ?? "vs last month"}</span>
            </p>
          )}
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", colors.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
