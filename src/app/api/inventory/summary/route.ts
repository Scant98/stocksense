import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [totalProducts, lowStockCount, outOfStockCount] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "low_stock" } }),
    prisma.product.count({ where: { status: "out_of_stock" } }),
  ]);

  return Response.json({
    totalProducts,
    lowStockCount,
    outOfStockCount,
    alertCount: lowStockCount + outOfStockCount,
  });
}
