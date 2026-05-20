import type { Transaction } from "@/lib/types";

export function getProductStatus(quantity: number, reorderPoint: number) {
  if (quantity <= 0) return "out_of_stock" as const;
  if (quantity <= reorderPoint * 0.5) return "low_stock" as const;
  if (quantity <= reorderPoint) return "warning" as const;
  return "in_stock" as const;
}

export function computeTransactionTotal(
  type: Transaction["type"],
  quantity: number,
  unitPrice: number
) {
  const amount = quantity * unitPrice;
  return type === "return" ? -amount : amount;
}
