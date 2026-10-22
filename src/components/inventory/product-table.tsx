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
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Stock</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Selling Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Value</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3"></th>
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
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{product.name}</p>
                      {(product.barcode || product.sku) && (
                        <p className="font-mono text-xs text-muted-foreground">{product.barcode || product.sku}</p>
                      )}
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
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {formatCurrency(product.sellingPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
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
                        <Button asChild variant="ghost" size="icon" title="Print label">
                          <Link href={`/labels?ids=${product.id}`}>
                            <QrCode className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(product.id)}
                          className="text-muted-foreground hover:text-destructive">
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
