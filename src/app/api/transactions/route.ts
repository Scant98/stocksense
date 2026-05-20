import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { computeTransactionTotal, getProductStatus } from "@/lib/inventory";
import { transactionPayloadSchema } from "@/lib/validators";
import { ZodError } from "zod";

const include = {
  product: {
    include: { category: true, supplier: true },
  },
} as const;

type TransactionWithProduct = Prisma.TransactionGetPayload<{ include: typeof include }>;

function mapTransaction(t: TransactionWithProduct) {
  return {
    ...t,
    product: {
      ...t.product,
      supplier: t.product.supplier ? {
        ...t.product.supplier,
        createdAt: t.product.supplier.createdAt.toISOString(),
        updatedAt: t.product.supplier.updatedAt.toISOString(),
      } : null,
      lastRestocked: t.product.lastRestocked?.toISOString(),
      createdAt: t.product.createdAt.toISOString(),
      updatedAt: t.product.updatedAt.toISOString(),
    },
    createdAt: t.createdAt.toISOString(),
  };
}

export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transactions = await prisma.transaction.findMany({
    include,
    orderBy: { createdAt: "desc" },
  });

  return Response.json(transactions.map(mapTransaction));
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = transactionPayloadSchema.parse(await request.json());
    const { productId, quantity, type, unitPrice } = body;

    const transaction = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) {
        throw new Error("Product not found");
      }

      if (type === "sale" && quantity > product.quantity) {
        throw new Error("Insufficient stock");
      }

      const created = await tx.transaction.create({
        data: {
          product: { connect: { id: productId } },
          type,
          quantity,
          unitPrice,
          totalAmount: computeTransactionTotal(type, quantity, unitPrice),
          reference: body.reference || `${type.toUpperCase()}-${Date.now()}`,
          notes: body.notes ?? "",
        },
        include,
      });

      if (type === "purchase" || type === "sale" || type === "adjustment" || type === "return") {
        let newQuantity = product.quantity;
        if (type === "purchase") newQuantity += quantity;
        else if (type === "sale") newQuantity -= quantity;
        else if (type === "adjustment") newQuantity = quantity;
        else if (type === "return") newQuantity += quantity;

        await tx.product.update({
          where: { id: body.productId },
          data: {
            quantity: Math.max(0, newQuantity),
            status: getProductStatus(Math.max(0, newQuantity), product.reorderPoint),
            ...(type === "purchase" ? { lastRestocked: new Date() } : {}),
          },
        });
      }

      return created;
    });

    return Response.json(mapTransaction(transaction));
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid transaction payload", detail: error.issues[0]?.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to create transaction";
    console.error(error);
    const status = message === "Product not found" ? 404 : message === "Insufficient stock" ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}
