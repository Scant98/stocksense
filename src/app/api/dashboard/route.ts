import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [products, transactions, suppliers, categories] = await Promise.all([
    prisma.product.findMany({
      include: { category: true, supplier: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.findMany({
      include: { product: { include: { category: true, supplier: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplier.findMany(),
    prisma.category.findMany(),
  ]);

  const totalValue = products.reduce((s, p) => s + p.quantity * p.sellingPrice, 0);
  const lowStockCount = products.filter((p) => p.status === "low_stock").length;
  const outOfStockCount = products.filter((p) => p.status === "out_of_stock").length;
  const totalSales = transactions
    .filter((t) => t.type === "sale")
    .reduce((s, t) => s + t.totalAmount, 0);
  const activeSuppliers = suppliers.filter((s) => s.status === "active").length;
  const totalOrders = transactions.filter((t) => t.type === "purchase").length;

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString("default", { month: "short" }) };
  });

  const salesChartData = months.map(({ year, month, label }) => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    const sales = transactions
      .filter((t) => t.type === "sale" && new Date(t.createdAt) >= start && new Date(t.createdAt) < end)
      .reduce((s, t) => s + t.totalAmount, 0);
    const purchases = transactions
      .filter((t) => t.type === "purchase" && new Date(t.createdAt) >= start && new Date(t.createdAt) < end)
      .reduce((s, t) => s + t.totalAmount, 0);
    return { month: label, sales, purchases };
  });

  const categoryStockData = categories.map((cat) => {
    const catProducts = products.filter((p) => p.categoryId === cat.id);
    return {
      name: cat.name,
      value: catProducts.reduce((s, p) => s + p.quantity, 0),
      color: cat.color,
    };
  }).filter((c) => c.value > 0);

  const recentTransactions = transactions.slice(0, 6).map((t) => ({
    ...t,
    product: {
      ...t.product,
      supplier: t.product.supplier ? {
        ...t.product.supplier,
        createdAt: t.product.supplier.createdAt.toISOString(),
        updatedAt: t.product.supplier.updatedAt.toISOString(),
      } : undefined,
      lastRestocked: t.product.lastRestocked.toISOString(),
      createdAt: t.product.createdAt.toISOString(),
      updatedAt: t.product.updatedAt.toISOString(),
    },
    createdAt: t.createdAt.toISOString(),
  }));

  return Response.json({
    totalProducts: products.length,
    inventoryValue: totalValue,
    lowStockCount,
    outOfStockCount,
    totalSales,
    activeSuppliers,
    totalOrders,
    categoriesCount: categories.length,
    salesChartData,
    categoryStockData,
    recentTransactions,
    products: products.map((p) => ({
      ...p,
      supplier: p.supplier ? {
        ...p.supplier,
        createdAt: p.supplier.createdAt.toISOString(),
        updatedAt: p.supplier.updatedAt.toISOString(),
      } : undefined,
      lastRestocked: p.lastRestocked.toISOString(),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
  });
}
