import type { Prisma } from "@prisma/client";

export const productInclude = {
  category: true,
  supplier: true,
} as const;

export type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export function mapProduct(p: ProductWithRelations) {
  return {
    ...p,
    supplier: p.supplier
      ? {
          ...p.supplier,
          createdAt: p.supplier.createdAt.toISOString(),
          updatedAt: p.supplier.updatedAt.toISOString(),
        }
      : null,
    lastRestocked: p.lastRestocked?.toISOString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export const saleInclude = {
  items: { include: { product: { select: { name: true, barcode: true } } }, orderBy: { createdAt: "asc" } },
} satisfies Prisma.SaleInclude;

export type SaleWithItems = Prisma.SaleGetPayload<{ include: typeof saleInclude }>;

export function mapSale(sale: SaleWithItems) {
  return {
    id: sale.id,
    receiptNumber: sale.receiptNumber,
    paymentMethod: sale.paymentMethod,
    subtotal: sale.subtotal,
    total: sale.total,
    amountPaid: sale.amountPaid,
    change: sale.change,
    customerName: sale.customerName,
    cashierName: sale.cashierName,
    createdAt: sale.createdAt.toISOString(),
    items: sale.items.map((t) => ({
      id: t.id,
      productId: t.productId,
      name: t.product.name,
      barcode: t.product.barcode,
      quantity: t.quantity,
      unitPrice: t.unitPrice,
      total: t.totalAmount,
    })),
  };
}
