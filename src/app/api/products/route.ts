import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getProductStatus } from "@/lib/inventory";
import { productPayloadSchema } from "@/lib/validators";
import { generateEan13 } from "@/lib/barcode";
import { mapProduct, productInclude } from "@/lib/serializers";
import { ZodError } from "zod";

export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    include: productInclude,
    orderBy: { createdAt: "desc" },
  });

  return Response.json(products.map(mapProduct));
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = productPayloadSchema.parse(await request.json());

    // Every product gets a scannable code; auto-assign an in-store EAN-13 when
    // the owner didn't scan or type a manufacturer barcode.
    const generated = !body.barcode;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const product = await prisma.product.create({
          data: {
            name: body.name,
            sku: body.sku ?? null,
            barcode: body.barcode ?? generateEan13(),
            category: { connect: { id: body.categoryId } },
            supplier: body.supplierId ? { connect: { id: body.supplierId } } : undefined,
            quantity: body.quantity,
            reorderPoint: body.reorderPoint,
            unitPrice: body.unitPrice,
            sellingPrice: body.sellingPrice,
            description: body.description ?? "",
            status: getProductStatus(body.quantity, body.reorderPoint),
            location: body.location ?? "",
            lastRestocked: body.lastRestocked ?? new Date(),
          },
          include: productInclude,
        });
        return Response.json(mapProduct(product));
      } catch (error) {
        const duplicate = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
        if (duplicate && generated) continue; // random code collided, try another
        throw error;
      }
    }
    return Response.json({ error: "Could not allocate a unique barcode" }, { status: 500 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid product payload", detail: error.issues[0]?.message }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ error: "Barcode already used", detail: "Another product already has this barcode." }, { status: 409 });
    }
    console.error("Product create error:", error);
    return Response.json({ error: "Failed to create product" }, { status: 500 });
  }
}
