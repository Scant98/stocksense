"use client";
import Link from "next/link";
import { Edit2, Trash2, Eye, QrCode } from "lucide-react";
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
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground sm:px-4">Product</th>
              <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground md:table-cell">Category</th>
              <th className="px-2 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground sm:px-4">Stock</th>
              <th className="px-2 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground sm:px-4">Price</th>
              <th className="hidden px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground lg:table-cell">Value</th>
              <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground sm:table-cell">Status</th>
              <th className="px-2 py-3 sm:px-4"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
                const status = statusConfig[product.status];
                const isLow = product.status === "low_stock" || product.status === "out_of_stock";
                return (
                  <tr
                    key={product.id}
                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${isLow ? "bg-destructive/5" : ""}`}
                  >
                    <td className="cursor-pointer px-2 py-3 sm:px-4" onClick={() => onView(product)}>
                      <p className="font-medium text-foreground">{product.name}</p>
                      {(product.barcode || product.sku) && (
                        <p className="font-mono text-[11px] text-muted-foreground sm:text-xs">{product.barcode || product.sku}</p>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
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
                    <td className="px-2 py-3 text-right sm:px-4">
                      <div
                        className={`font-semibold ${
                          product.status === "out_of_stock"
                            ? "text-destructive"
                            : product.status === "low_stock"
                            ? "text-warning"
                            : "text-foreground"
                        }`}
                      >
                        {product.quantity}
                      </div>
                      <p className="text-xs text-muted-foreground">min {product.reorderPoint}</p>
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 text-right text-[13px] font-medium text-foreground sm:px-4 sm:text-sm">
                      {formatCurrency(product.sellingPrice)}
                    </td>
                    <td className="hidden px-4 py-3 text-right font-medium text-foreground lg:table-cell">
                      {formatCurrency(product.quantity * product.sellingPrice)}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="px-2 py-3 sm:px-4">
                      <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                        <Button variant="ghost" size="icon" className="hidden sm:inline-flex" onClick={() => onView(product)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button asChild variant="ghost" size="icon" title="Print label" className="hidden sm:inline-flex">
                          <Link href={`/labels?ids=${product.id}`}>
                            <QrCode className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="size-7 sm:size-8" onClick={() => onEdit(product)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(product.id)}
                          className="size-7 text-muted-foreground hover:text-destructive sm:size-8">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
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
