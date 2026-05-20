"use client";
import { motion } from "framer-motion";
import {
  Package,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  ShoppingCart,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { LowStockAlert } from "@/components/dashboard/low-stock-alert";
import { Meteors } from "@/components/magic/meteors";
import { BlurFade } from "@/components/magic/blur-fade";
import { formatCurrency } from "@/lib/utils";
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
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6366F1] border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return <QueryErrorState message={error?.message ?? "Dashboard data is unavailable."} />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
      {/* Hero Banner */}
      <div className="relative overflow-hidden border-b border-white/8 bg-gradient-to-br from-[#0A0F1E] via-[#0f1729] to-[#0A0F1E] px-6 py-8">
        <Meteors number={15} />
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-xs font-medium uppercase tracking-widest text-[#6366F1]" suppressHydrationWarning>
              {dateLabel} · Dar es Salaam
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">
              Good {greeting}, {firstName} 👋
            </h1>
            <p className="mt-1 text-sm text-[#9CA3AF]">
              Here&apos;s what&apos;s happening with your inventory today.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Low Stock Alert */}
        <BlurFade delay={0.1}>
          <LowStockAlert products={data.products} />
        </BlurFade>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
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
            icon={TrendingUp}
            change={18}
            accent="primary"
            delay={0.3}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard
            title="Active Suppliers"
            value={data.activeSuppliers}
            icon={Users}
            accent="success"
            delay={0.35}
          />
          <StatCard
            title="Out of Stock"
            value={data.outOfStockCount}
            icon={Package}
            accent="danger"
            delay={0.38}
          />
          <StatCard
            title="Total Orders"
            value={data.totalOrders}
            icon={ShoppingCart}
            change={5}
            accent="primary"
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
