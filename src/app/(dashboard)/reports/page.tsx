"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Percent } from "lucide-react";
import { Header } from "@/components/layout/header";
import { BlurFade } from "@/components/magic/blur-fade";
import { AnimatedNumber } from "@/components/magic/animated-number";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";
import { useReports, type ReportPeriod } from "@/hooks/use-api";
import { QueryErrorState } from "@/components/layout/query-error-state";

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: "day", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

function DarkTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl p-3 text-sm border border-border shadow-2xl">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground capitalize">{p.name}</span>
          <span className="font-semibold text-foreground">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function KpiCard({ label, value, color, icon: Icon, sub }: { label: string; value: number; color: string; icon: React.ElementType; sub?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass min-w-0 rounded-2xl p-3.5 sm:p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-[11px] font-medium uppercase leading-snug tracking-wider text-muted-foreground sm:text-xs">{label}</p>
        <div className="shrink-0 rounded-lg p-1.5" style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <p className="mt-2 text-xl font-bold leading-tight sm:mt-3 sm:text-2xl" style={{ color }}>
        {/* Short form on phones so big amounts never get clipped by the card. */}
        <AnimatedNumber value={value} formatter={formatCompactCurrency} duration={900} className="sm:hidden" />
        <AnimatedNumber value={value} formatter={formatCurrency} duration={900} className="hidden sm:inline" />
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </motion.div>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const { data, isLoading, error } = useReports(period);

  const isLosingMoney = (data?.summary.grossProfit ?? 0) < 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
      <Header title="Reports" subtitle="Financial analytics & profit tracking" />

      <div className="p-6 space-y-6">
        {/* Period selector */}
        <BlurFade delay={0.05}>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                  period === p.value
                    ? "border-primary/50 bg-primary/20 text-primary"
                    : "border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </BlurFade>

        {isLoading && (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {error && <QueryErrorState message={error.message} />}

        {data && !isLoading && (
          <>
            {/* KPI Row */}
            <BlurFade delay={0.1}>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                <KpiCard
                  label="Total Revenue"
                  value={data.summary.revenue}
                  color="var(--success)"
                  icon={DollarSign}
                  sub={`${data.summary.salesCount} transactions · ${data.summary.unitsSold} units`}
                />
                <KpiCard
                  label="Cost of Goods"
                  value={data.summary.cogs}
                  color="var(--warning)"
                  icon={ShoppingCart}
                  sub="Total purchase cost of sold items"
                />
                <KpiCard
                  label="Gross Profit"
                  value={data.summary.grossProfit}
                  color={isLosingMoney ? "var(--destructive)" : "var(--primary)"}
                  icon={isLosingMoney ? TrendingDown : TrendingUp}
                  sub="Revenue minus cost of goods"
                />
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass min-w-0 rounded-2xl p-3.5 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 text-[11px] font-medium uppercase leading-snug tracking-wider text-muted-foreground sm:text-xs">Profit Margin</p>
                    <div className="rounded-lg p-1.5 bg-primary/20">
                      <Percent className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <p className={`mt-2 text-xl font-bold leading-tight sm:mt-3 sm:text-2xl ${isLosingMoney ? "text-destructive" : "text-primary"}`}>
                    <AnimatedNumber value={data.summary.margin} formatter={(v) => `${v.toFixed(1)}%`} duration={900} />
                  </p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${isLosingMoney ? "bg-destructive" : "bg-gradient-to-r from-primary to-success"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(0, data.summary.margin))}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              </div>
            </BlurFade>

            {/* Revenue vs COGS Chart */}
            <BlurFade delay={0.2}>
              <div className="glass rounded-2xl p-5">
                <h3 className="mb-1 text-sm font-medium text-muted-foreground">Revenue vs Cost</h3>
                <p className="mb-5 text-base font-bold text-foreground">Sales Revenue & Cost of Goods Sold</p>
                {data.chartData.every((d) => d.revenue === 0) ? (
                  <div className="flex h-48 items-center justify-center text-muted-foreground text-sm">
                    No sales data for this period
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={data.chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="cogsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="var(--warning)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--success)" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toString()} />
                      <Tooltip content={<DarkTooltip />} />
                      <Area dataKey="revenue" name="Revenue" stroke="var(--primary)" strokeWidth={2} fill="url(#revGrad)" dot={false} />
                      <Area dataKey="cogs" name="COGS" stroke="var(--warning)" strokeWidth={2} fill="url(#cogsGrad)" dot={false} />
                      <Area dataKey="profit" name="Profit" stroke="var(--success)" strokeWidth={2} fill="url(#profitGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
                <div className="mt-3 flex gap-5 justify-center text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />Revenue</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning" />Cost of Goods</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" />Gross Profit</span>
                </div>
              </div>
            </BlurFade>

            {/* Product Profitability Table */}
            <BlurFade delay={0.3}>
              <div className="glass rounded-2xl p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Product Profitability</h3>
                    <p className="text-base font-bold text-foreground">Profit per product — cost to buy vs revenue earned</p>
                  </div>
                  <span className="rounded-full bg-muted/40 border border-border px-3 py-1 text-xs text-muted-foreground">
                    {data.productBreakdown.length} products sold
                  </span>
                </div>

                {data.productBreakdown.length === 0 ? (
                  <div className="flex h-24 items-center justify-center text-muted-foreground text-sm">
                    No sales recorded for this period
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Product</th>
                          <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Units Sold</th>
                          <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Revenue</th>
                          <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Cost (COGS)</th>
                          <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Profit</th>
                          <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Margin</th>
                          <th className="pb-3 pl-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Profit Bar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {data.productBreakdown.map((p, i) => {
                          const maxProfit = Math.max(...data.productBreakdown.map((x) => Math.abs(x.profit)), 1);
                          const barPct = Math.abs(p.profit) / maxProfit * 100;
                          const isNeg = p.profit < 0;
                          return (
                            <motion.tr
                              key={p.productId}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.05 * i }}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-2.5">
                                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: p.categoryColor }} />
                                  <div>
                                    <p className="font-medium text-foreground">{p.productName}</p>
                                    <p className="text-xs text-muted-foreground">{p.categoryName}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 text-right text-muted-foreground">{p.unitsSold}</td>
                              <td className="py-3 text-right font-medium text-success">{formatCurrency(p.revenue)}</td>
                              <td className="py-3 text-right text-warning">{formatCurrency(p.cogs)}</td>
                              <td className={`py-3 text-right font-semibold ${isNeg ? "text-destructive" : "text-primary"}`}>
                                {isNeg ? "-" : "+"}{formatCurrency(Math.abs(p.profit))}
                              </td>
                              <td className={`py-3 text-right text-xs font-medium ${isNeg ? "text-destructive" : "text-muted-foreground"}`}>
                                {p.margin.toFixed(1)}%
                              </td>
                              <td className="py-3 pl-4 w-32">
                                <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                                  <motion.div
                                    className={`h-full rounded-full ${isNeg ? "bg-destructive" : "bg-gradient-to-r from-primary to-success"}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${barPct}%` }}
                                    transition={{ duration: 0.6, delay: 0.05 * i }}
                                  />
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-border">
                          <td className="pt-3 text-sm font-semibold text-foreground">Total</td>
                          <td className="pt-3 text-right text-sm font-semibold text-muted-foreground">{data.summary.unitsSold}</td>
                          <td className="pt-3 text-right text-sm font-semibold text-success">{formatCurrency(data.summary.revenue)}</td>
                          <td className="pt-3 text-right text-sm font-semibold text-warning">{formatCurrency(data.summary.cogs)}</td>
                          <td className={`pt-3 text-right text-sm font-bold ${isLosingMoney ? "text-destructive" : "text-primary"}`}>
                            {isLosingMoney ? "-" : "+"}{formatCurrency(Math.abs(data.summary.grossProfit))}
                          </td>
                          <td className={`pt-3 text-right text-sm font-semibold ${isLosingMoney ? "text-destructive" : "text-primary"}`}>
                            {data.summary.margin.toFixed(1)}%
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </BlurFade>

            {/* Profit by Category Bar Chart */}
            {data.productBreakdown.length > 0 && (() => {
              const categoryMap = new Map<string, { name: string; color: string; revenue: number; cogs: number; profit: number }>();
              for (const p of data.productBreakdown) {
                const existing = categoryMap.get(p.categoryName);
                if (existing) {
                  existing.revenue += p.revenue;
                  existing.cogs += p.cogs;
                  existing.profit += p.profit;
                } else {
                  categoryMap.set(p.categoryName, { name: p.categoryName, color: p.categoryColor, revenue: p.revenue, cogs: p.cogs, profit: p.profit });
                }
              }
              const catData = [...categoryMap.values()].sort((a, b) => b.profit - a.profit);
              return (
                <BlurFade delay={0.4}>
                  <div className="glass rounded-2xl p-5">
                    <h3 className="mb-1 text-sm font-medium text-muted-foreground">Category Breakdown</h3>
                    <p className="mb-5 text-base font-bold text-foreground">Profit by Category</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={catData} barGap={4} barSize={28}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toString()} />
                        <Tooltip content={<DarkTooltip />} />
                        <Bar dataKey="revenue" name="Revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} opacity={0.85} />
                        <Bar dataKey="cogs" name="Cost" fill="var(--warning)" radius={[4, 4, 0, 0]} opacity={0.85} />
                        <Bar dataKey="profit" name="Profit" fill="var(--success)" radius={[4, 4, 0, 0]} opacity={0.9} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-3 flex gap-5 justify-center text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />Revenue</span>
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning" />Cost</span>
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" />Profit</span>
                    </div>
                  </div>
                </BlurFade>
              );
            })()}
          </>
        )}
      </div>
    </motion.div>
  );
}
