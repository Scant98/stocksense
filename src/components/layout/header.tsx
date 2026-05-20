"use client";
import { Bell } from "lucide-react";
import { motion } from "framer-motion";
import { SyncIndicator } from "@/components/layout/sync-indicator";
import { useInventorySummary } from "@/hooks/use-api";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Header({ title, subtitle, action }: HeaderProps) {
  const { data: summary } = useInventorySummary();
  const lowStockCount = summary?.alertCount ?? 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/8 glass-strong px-6">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-semibold text-white"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.1 } }}
            className="text-xs text-[#9CA3AF]"
          >
            {subtitle}
          </motion.p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {action}
        <SyncIndicator />
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#9CA3AF] hover:text-white transition-colors"
          >
            <Bell className="h-4 w-4" />
            {lowStockCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#F43F5E] text-[10px] font-bold text-white"
              >
                {lowStockCount}
              </motion.span>
            )}
          </motion.button>
        </div>
      </div>
    </header>
  );
}
