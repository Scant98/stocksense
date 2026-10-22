import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getProductStatus } from "@/lib/inventory";
import { getNextReceiptNumber } from "@/lib/invoices";
import { mapSale, saleInclude } from "@/lib/serializers";
import { salePayloadSchema } from "@/lib/validators";
import { ZodError } from "zod";

class SaleError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Math.min(Number(new URL(request.url).searchParams.get("limit")) || 30, 100);
  const sales = await prisma.sale.findMany({
    include: saleInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return Response.json(sales.map(mapSale));
}

/** Check out a scanned basket: one receipt, one "sale" transaction per line. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = salePayloadSchema.parse(await request.json());

    const sale = await prisma.$transaction(
      async (tx) => {
        const now = new Date();
        const ids = [...new Set(body.items.map((i) => i.productId))];
        const products = await tx.product.findMany({ where: { id: { in: ids } } });
        const byId = new Map(products.map((p) => [p.id, p]));

        const lines = body.items.map((item) => {
          const product = byId.get(item.productId);
          if (!product) throw new SaleError("A product in the cart no longer exists", 404);
          const unitPrice = item.unitPrice ?? product.sellingPrice;
          return { product, quantity: item.quantity, unitPrice, total: item.quantity * unitPrice };
        });

        const total = lines.reduce((sum, l) => sum + l.total, 0);
        const amountPaid = body.paymentMethod === "cash" ? (body.amountPaid ?? total) : total;
        if (amountPaid < total) {
          throw new SaleError("Amount paid is less than the total", 400);
        }

        // Guarded decrement: the WHERE clause makes oversell impossible even
        // when two tills check out the last item at the same moment.
        for (const line of lines) {
          const { count } = await tx.product.updateMany({
            where: { id: line.product.id, quantity: { gte: line.quantity } },
            data: { quantity: { decrement: line.quantity } },
          });
          if (count !== 1) {
            const fresh = await tx.product.findUnique({
              where: { id: line.product.id },
              select: { quantity: true },
            });
            throw new SaleError(
              `Not enough stock for ${line.product.name} (${fresh?.quantity ?? 0} left)`,
              409
            );
          }
        }

        const receiptNumber = await getNextReceiptNumber(tx, now);
        const created = await tx.sale.create({
          data: {
            receiptNumber,
            paymentMethod: body.paymentMethod,
            subtotal: total,
            total,
            amountPaid,
            change: Math.max(0, amountPaid - total),
            customerName: body.customerName ?? "",
            cashierId: session.userId,
            cashierName: session.name,
            createdAt: now,
            items: {
              create: lines.map((l, i) => ({
                productId: l.product.id,
                type: "sale",
                quantity: l.quantity,
                unitPrice: l.unitPrice,
                totalAmount: l.total,
                reference: `${receiptNumber}-${i + 1}`,
                notes: `POS ${receiptNumber}`,
                createdAt: now,
              })),
            },
          },
          include: saleInclude,
        });

        // Refresh the cached stock status for everything that was sold.
        const updated = await tx.product.findMany({
          where: { id: { in: ids } },
          select: { id: true, quantity: true, reorderPoint: true, status: true },
        });
        for (const p of updated) {
          const status = getProductStatus(p.quantity, p.reorderPoint);
          if (status !== p.status) {
            await tx.product.update({ where: { id: p.id }, data: { status } });
          }
        }

        return created;
      },
      { timeout: 15_000 }
    );

    return Response.json(mapSale(sale));
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid sale", detail: error.issues[0]?.message }, { status: 400 });
    }
    if (error instanceof SaleError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("Checkout error:", error);
    return Response.json({ error: "Checkout failed" }, { status: 500 });
  }
}
