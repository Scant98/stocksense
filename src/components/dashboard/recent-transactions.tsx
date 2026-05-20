"use client";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, RefreshCw, RotateCcw } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/lib/types";

const typeConfig = {
  sale: { label: "Sale", icon: ArrowUpRight, variant: "success" as const },
  purchase: { label: "Purchase", icon: ArrowDownLeft, variant: "primary" as const },
  adjustment: { label: "Adjust", icon: RefreshCw, variant: "warning" as const },
  return: { label: "Return", icon: RotateCcw, variant: "muted" as const },
};

interface Props {
  transactions?: Transaction[];
}

export function RecentTransactions({ transactions = [] }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="glass rounded-2xl p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-[#9CA3AF]">Recent Activity</h3>
          <p className="text-lg font-bold text-white">Transactions</p>
        </div>
      </div>
      <div className="space-y-2">
        {transactions.map((txn, i) => {
          const type = txn.type as keyof typeof typeConfig;
          const config = typeConfig[type] ?? typeConfig.adjustment;
          const Icon = config.icon;
          return (
            <motion.div
              key={txn.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.06 }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5">
                <Icon className="h-3.5 w-3.5 text-[#9CA3AF]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{txn.product.name}</p>
                <p className="text-xs text-[#9CA3AF]">{formatDate(txn.createdAt)} · {txn.reference}</p>
              </div>
              <div className="text-right shrink-0">
                <Badge variant={config.variant} className="mb-0.5">{config.label}</Badge>
                <p className={`text-sm font-semibold ${txn.type === "sale" ? "text-[#10B981]" : txn.totalAmount < 0 ? "text-[#F43F5E]" : "text-white"}`}>
                  {txn.type === "sale" ? "+" : txn.totalAmount < 0 ? "-" : ""}{formatCurrency(Math.abs(txn.totalAmount))}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
