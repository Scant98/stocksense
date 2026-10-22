import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

type Period = "day" | "week" | "month" | "quarter" | "year" | "all";

function getPeriodRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case "day": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case "week": {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end };
    }
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), q * 3, 1);
      return { start, end };
    }
    case "year": {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start, end };
    }
    case "all":
    default:
      return { start: new Date(0), end };
  }
}

function buildChartBuckets(period: Period, start: Date, end: Date, transactions: { createdAt: Date; type: string; totalAmount: number; quantity: number; product: { unitPrice: number } }[]) {
  if (period === "day") {
    // 24 hourly buckets
    return Array.from({ length: 24 }, (_, h) => {
      const label = `${h.toString().padStart(2, "0")}:00`;
      const txs = transactions.filter((t) => {
        const d = new Date(t.createdAt);
        return d.getHours() === h && t.type === "sale";
      });
      const revenue = txs.reduce((s, t) => s + t.totalAmount, 0);
      const cogs = txs.reduce((s, t) => s + t.quantity * t.product.unitPrice, 0);
      return { label, revenue, cogs, profit: revenue - cogs };
    });
  }

  if (period === "week") {
    // 7 day buckets
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const label = d.toLocaleDateString("en-TZ", { weekday: "short", month: "short", day: "numeric" });
      const txs = transactions.filter((t) => {
        const td = new Date(t.createdAt);
        return td.toDateString() === d.toDateString() && t.type === "sale";
      });
      const revenue = txs.reduce((s, t) => s + t.totalAmount, 0);
      const cogs = txs.reduce((s, t) => s + t.quantity * t.product.unitPrice, 0);
      return { label, revenue, cogs, profit: revenue - cogs };
    });
  }

  if (period === "month") {
    // daily buckets for the month
    const days = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const label = d.getDate().toString();
      const txs = transactions.filter((t) => {
        const td = new Date(t.createdAt);
        return td.toDateString() === d.toDateString() && t.type === "sale";
      });
      const revenue = txs.reduce((s, t) => s + t.totalAmount, 0);
      const cogs = txs.reduce((s, t) => s + t.quantity * t.product.unitPrice, 0);
      return { label, revenue, cogs, profit: revenue - cogs };
    });
  }

  if (period === "quarter") {
    // weekly buckets
    const weeks: { label: string; revenue: number; cogs: number; profit: number }[] = [];
    const cur = new Date(start);
    let weekNum = 1;
    while (cur <= end) {
      const wStart = new Date(cur);
      const wEnd = new Date(cur);
      wEnd.setDate(cur.getDate() + 6);
      if (wEnd > end) wEnd.setTime(end.getTime());
      const label = `Wk ${weekNum}`;
      const txs = transactions.filter((t) => {
        const td = new Date(t.createdAt);
        return td >= wStart && td <= wEnd && t.type === "sale";
      });
      const revenue = txs.reduce((s, t) => s + t.totalAmount, 0);
      const cogs = txs.reduce((s, t) => s + t.quantity * t.product.unitPrice, 0);
      weeks.push({ label, revenue, cogs, profit: revenue - cogs });
      cur.setDate(cur.getDate() + 7);
      weekNum++;
    }
    return weeks;
  }

  // year or all: monthly buckets
  const months: { label: string; revenue: number; cogs: number; profit: number }[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cur <= end) {
    const mStart = new Date(cur);
    const mEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0, 23, 59, 59, 999);
    const label = cur.toLocaleString("default", { month: "short", year: period === "all" ? "2-digit" : undefined });
    const txs = transactions.filter((t) => {
      const td = new Date(t.createdAt);
      return td >= mStart && td <= mEnd && t.type === "sale";
    });
    const revenue = txs.reduce((s, t) => s + t.totalAmount, 0);
    const cogs = txs.reduce((s, t) => s + t.quantity * t.product.unitPrice, 0);
    months.push({ label, revenue, cogs, profit: revenue - cogs });
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const period = (url.searchParams.get("period") ?? "month") as Period;
  const { start, end } = getPeriodRange(period);

  const transactions = await prisma.transaction.findMany({
    where:
      period === "all"
        ? { type: "sale" }
        : { type: "sale", createdAt: { gte: start, lte: end } },
    include: { product: { include: { category: true } } },
    orderBy: { createdAt: "asc" },
  });

  const sales = transactions.filter((t) => t.type === "sale");

  const revenue = sales.reduce((s, t) => s + t.totalAmount, 0);
  const cogs = sales.reduce((s, t) => s + t.quantity * t.product.unitPrice, 0);
  const grossProfit = revenue - cogs;
  const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const salesCount = sales.length;
  const unitsSold = sales.reduce((s, t) => s + t.quantity, 0);

  // Per-product profitability
  const productMap = new Map<string, {
    productId: string;
    productName: string;
    categoryName: string;
    categoryColor: string;
    unitsSold: number;
    revenue: number;
    cogs: number;
  }>();

  for (const t of sales) {
    const existing = productMap.get(t.productId);
    const txRevenue = t.totalAmount;
    const txCogs = t.quantity * t.product.unitPrice;
    if (existing) {
      existing.unitsSold += t.quantity;
      existing.revenue += txRevenue;
      existing.cogs += txCogs;
    } else {
      productMap.set(t.productId, {
        productId: t.productId,
        productName: t.product.name,
        categoryName: t.product.category.name,
        categoryColor: t.product.category.color,
        unitsSold: t.quantity,
        revenue: txRevenue,
        cogs: txCogs,
      });
    }
  }

  const productBreakdown = [...productMap.values()]
    .map((p) => ({
      ...p,
      profit: p.revenue - p.cogs,
      margin: p.revenue > 0 ? ((p.revenue - p.cogs) / p.revenue) * 100 : 0,
    }))
    .sort((a, b) => b.profit - a.profit);

  const chartData = buildChartBuckets(period, start, end, transactions.map((t) => ({
    createdAt: t.createdAt,
    type: t.type,
    totalAmount: t.totalAmount,
    quantity: t.quantity,
    product: { unitPrice: t.product.unitPrice },
  })));

  return Response.json({
    period,
    summary: { revenue, cogs, grossProfit, margin, salesCount, unitsSold },
    chartData,
    productBreakdown,
  });
}
