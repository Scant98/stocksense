"use client";
import { motion } from "framer-motion";
import {
  Package,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  ShoppingCart,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { LowStockAlert } from "@/components/dashboard/low-stock-alert";
import { BlurFade } from "@/components/magic/blur-fade";
import { PageSpinner } from "@/components/layout/page-spinner";
import { Header } from "@/components/layout/header";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";
import { useDashboard, useUser } from "@/hooks/use-api";
import { QueryErrorState } from "@/components/layout/query-error-state";

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();
  const { data: user } = useUser();

  const dateLabel = new Date().toLocaleString("default", { month: "long", year: "numeric" });
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  })();

  const firstName = user?.name?.split(" ")[0] ?? "there";

  if (isLoading) {
    return (
      <PageSpinner />
    );
  }

  if (error || !data) {
    return <QueryErrorState message={error?.message ?? "Dashboard data is unavailable."} />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
      <Header title="Dashboard" subtitle="Overview of your shop" />

      {/* Hero Banner */}
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/10 via-background to-background px-4 py-6 sm:px-6 sm:py-8">
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-xs font-medium uppercase tracking-widest text-primary" suppressHydrationWarning>
              {dateLabel} · Dar es Salaam
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">
              Good {greeting}, {firstName} 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Here&apos;s what&apos;s happening with your inventory today.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
        {/* Low Stock Alert */}
        <BlurFade delay={0.1}>
          <LowStockAlert products={data.products} />
        </BlurFade>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard
            title="Total Products"
            value={data.totalProducts}
            icon={Package}
            change={8}
            accent="primary"
            delay={0.15}
          />
          <StatCard
            title="Inventory Value"
            value={data.inventoryValue}
            formatter={formatCurrency}
            compactFormatter={formatCompactCurrency}
            icon={DollarSign}
            change={12}
            accent="success"
            delay={0.2}
          />
          <StatCard
            title="Low Stock Items"
            value={data.lowStockCount + data.outOfStockCount}
            icon={AlertTriangle}
            change={-3}
            changeLabel="vs last week"
            accent="warning"
            delay={0.25}
          />
          <StatCard
            title="Total Sales"
            value={data.totalSales}
            formatter={formatCurrency}
            compactFormatter={formatCompactCurrency}
            icon={TrendingUp}
            change={18}
            accent="primary"
            delay={0.3}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard
            title="Today's Revenue"
            value={data.todaySalesAmount}
            formatter={formatCurrency}
            compactFormatter={formatCompactCurrency}
            icon={TrendingUp}
            accent="success"
            delay={0.35}
          />
          <StatCard
            title="Today's Sales"
            value={data.todaySalesCount}
            icon={ShoppingCart}
            accent="primary"
            delay={0.38}
          />
          <StatCard
            title="Out of Stock"
            value={data.outOfStockCount}
            icon={Package}
            accent="danger"
            delay={0.41}
          />
          <StatCard
            title="Categories"
            value={data.categoriesCount}
            icon={Package}
            accent="warning"
            delay={0.44}
          />
        </div>

        {/* Charts Row */}
        <BlurFade delay={0.3}>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <SalesChart data={data.salesChartData} />
            </div>
            <CategoryChart data={data.categoryStockData} />
          </div>
        </BlurFade>

        {/* Transactions */}
        <BlurFade delay={0.4}>
          <RecentTransactions transactions={data.recentTransactions} />
        </BlurFade>
      </div>
    </motion.div>
  );
}
