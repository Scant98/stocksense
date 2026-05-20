import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { getProductStatus } from "@/lib/inventory";
import { productPayloadSchema } from "@/lib/validators";
import { ZodError } from "zod";

const include = {
  category: true,
  supplier: true,
} as const;

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof include }>;

function mapProduct(p: ProductWithRelations) {
  return {
    ...p,
    supplier: p.supplier ? {
      ...p.supplier,
      createdAt: p.supplier.createdAt.toISOString(),
      updatedAt: p.supplier.updatedAt.toISOString(),
    } : null,
    lastRestocked: p.lastRestocked?.toISOString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function PUT(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const body = productPayloadSchema.parse(await request.json());
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        sku: body.sku ?? null,
        category: { connect: { id: body.categoryId } },
        supplier: body.supplierId ? { connect: { id: body.supplierId } } : { disconnect: true },
        quantity: body.quantity,
        reorderPoint: body.reorderPoint,
        unitPrice: body.unitPrice,
        sellingPrice: body.sellingPrice,
        description: body.description ?? "",
        status: getProductStatus(body.quantity, body.reorderPoint),
        location: body.location ?? "",
        lastRestocked: body.lastRestocked,
      },
      include,
    });

    return Response.json(mapProduct(product));
  } catch (error) {
    console.error(error);
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid product payload", detail: error.issues[0]?.message }, { status: 400 });
    }
    return Response.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return Response.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
