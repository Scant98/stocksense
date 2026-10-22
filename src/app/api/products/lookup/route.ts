import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { codeVariants } from "@/lib/barcode";
import { mapProduct, productInclude } from "@/lib/serializers";

/** Resolve a scanned barcode / QR payload / SKU to a product. */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const code = new URL(request.url).searchParams.get("code") ?? "";
  const variants = codeVariants(code);
  if (variants.length === 0) {
    return Response.json({ error: "Missing code" }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { barcode: { in: variants } },
        { sku: { in: variants } },
        { id: { in: variants } },
      ],
    },
    include: productInclude,
  });

  if (!product) {
    return Response.json({ error: "No product matches this code" }, { status: 404 });
  }
  return Response.json(mapProduct(product));
}
