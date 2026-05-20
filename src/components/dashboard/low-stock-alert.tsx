"use client";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { Product } from "@/lib/types";

interface Props {
  products?: Product[];
}

export function LowStockAlert({ products = [] }: Props) {
  const alertItems = products.filter(
    (p) => p.status === "low_stock" || p.status === "out_of_stock"
  );

  if (alertItems.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-2xl border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.05)] p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
          </motion.div>
          <span className="text-sm font-semibold text-[#F59E0B]">
            Low Stock Alert — {alertItems.length} items need attention
          </span>
        </div>
        <Link href="/inventory" className="text-xs text-[#6366F1] hover:text-[#818CF8] transition-colors">
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {alertItems.slice(0, 3).map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{p.name}</p>
              <p className="text-xs text-[#9CA3AF]">SKU: {p.sku ? p.sku.split("-").slice(-1)[0] : "—"}</p>
            </div>
            <div className="ml-3 shrink-0 text-right">
              <p className={`text-sm font-bold ${p.status === "out_of_stock" ? "text-[#F43F5E]" : "text-[#F59E0B]"}`}>
                {p.quantity}
              </p>
              <p className="text-xs text-[#9CA3AF]">/ {p.reorderPoint} min</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
