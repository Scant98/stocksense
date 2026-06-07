"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types";

const statusConfig = {
  in_stock: { label: "In Stock", variant: "success" as const },
  warning: { label: "Low Soon", variant: "warning" as const },
  low_stock: { label: "Low Stock", variant: "danger" as const },
  out_of_stock: { label: "Out of Stock", variant: "danger" as const },
};

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onView: (product: Product) => void;
}

export function ProductTable({ products, onEdit, onDelete, onView }: ProductTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/8">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 bg-white/3">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">Category</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">Stock</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">Selling Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">Value</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {products.map((product, i) => {
                const status = statusConfig[product.status];
                const isLow = product.status === "low_stock" || product.status === "out_of_stock";
                return (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className={`border-b border-white/5 hover:bg-white/3 transition-colors ${isLow ? "bg-[rgba(244,63,94,0.02)]" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{product.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: product.category.color + "20",
                          color: product.category.color,
                        }}
                      >
                        {product.category.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <motion.div
                        animate={isLow ? { opacity: [1, 0.5, 1] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className={`font-semibold ${
                          product.status === "out_of_stock"
                            ? "text-[#F43F5E]"
                            : product.status === "low_stock"
                            ? "text-[#F59E0B]"
                            : "text-white"
                        }`}
                      >
                        {product.quantity}
                      </motion.div>
                      <p className="text-xs text-[#9CA3AF]">min {product.reorderPoint}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-white">
                      {formatCurrency(product.sellingPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-white">
                      {formatCurrency(product.quantity * product.sellingPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => onView(product)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(product.id)}
                          className="text-[#9CA3AF] hover:text-[#F43F5E]">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="py-16 text-center text-[#9CA3AF]">
            <Package className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p>No products found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Package({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}
