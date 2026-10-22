import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { mapProduct, productInclude } from "@/lib/serializers";

export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const chartStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // Everything below is aggregated in the database; nothing loads whole tables.
  const [
    totalProducts,
    lowStockCount,
    outOfStockCount,
    inventoryValueRows,
    salesTotal,
    activeSuppliers,
    totalOrders,
    todaySalesTotal,
    todayReceipts,
    todayLooseSales,
    categoriesCount,
    chartRows,
    categoryStock,
    categories,
    recent,
    alertProducts,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "low_stock" } }),
    prisma.product.count({ where: { status: "out_of_stock" } }),
    prisma.$queryRaw<{ value: number }[]>`SELECT COALESCE(SUM("quantity" * "sellingPrice"), 0)::float8 AS value FROM "Product"`,
    prisma.transaction.aggregate({ where: { type: "sale" }, _sum: { totalAmount: true } }),
    prisma.supplier.count({ where: { status: "active" } }),
    prisma.transaction.count({ where: { type: "purchase" } }),
    prisma.transaction.aggregate({
      where: { type: "sale", createdAt: { gte: todayStart } },
      _sum: { totalAmount: true },
    }),
    prisma.sale.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.transaction.count({ where: { type: "sale", saleId: null, createdAt: { gte: todayStart } } }),
    prisma.category.count(),
    prisma.transaction.findMany({
      where: { type: { in: ["sale", "purchase"] }, createdAt: { gte: chartStart } },
      select: { type: true, totalAmount: true, createdAt: true },
    }),
    prisma.product.groupBy({ by: ["categoryId"], _sum: { quantity: true } }),
    prisma.category.findMany({ select: { id: true, name: true, color: true } }),
    prisma.transaction.findMany({
      include: { product: { include: productInclude } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.product.findMany({
      where: { status: { in: ["low_stock", "out_of_stock"] } },
      include: productInclude,
      orderBy: { quantity: "asc" },
      take: 50,
    }),
  ]);

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { key: d.getFullYear() * 12 + d.getMonth(), label: d.toLocaleString("en", { month: "short" }), sales: 0, purchases: 0 };
  });
  const bucketByKey = new Map(months.map((m) => [m.key, m]));
  for (const row of chartRows) {
    const bucket = bucketByKey.get(row.createdAt.getFullYear() * 12 + row.createdAt.getMonth());
    if (!bucket) continue;
    if (row.type === "sale") bucket.sales += row.totalAmount;
    else bucket.purchases += row.totalAmount;
  }

  const quantityByCategory = new Map(categoryStock.map((c) => [c.categoryId, c._sum.quantity ?? 0]));
  const categoryStockData = categories
    .map((c) => ({ name: c.name, value: quantityByCategory.get(c.id) ?? 0, color: c.color }))
    .filter((c) => c.value > 0);

  return Response.json({
    totalProducts,
    inventoryValue: inventoryValueRows[0]?.value ?? 0,
    lowStockCount,
    outOfStockCount,
    totalSales: salesTotal._sum.totalAmount ?? 0,
    activeSuppliers,
    totalOrders,
    todaySalesAmount: todaySalesTotal._sum.totalAmount ?? 0,
    todaySalesCount: todayReceipts + todayLooseSales,
    categoriesCount,
    salesChartData: months.map(({ label, sales, purchases }) => ({ month: label, sales, purchases })),
    categoryStockData,
    recentTransactions: recent.map((t) => ({
      ...t,
      product: mapProduct(t.product),
      createdAt: t.createdAt.toISOString(),
    })),
    products: alertProducts.map(mapProduct),
  });
}
