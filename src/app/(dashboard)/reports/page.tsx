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
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Percent } from "lucide-react";
import { Header } from "@/components/layout/header";
import { BlurFade } from "@/components/magic/blur-fade";
import { AnimatedNumber } from "@/components/magic/animated-number";
import { formatCurrency } from "@/lib/utils";
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
    <div className="glass-strong rounded-xl p-3 text-sm border border-white/10 shadow-2xl">
      <p className="mb-2 text-xs font-medium text-[#9CA3AF]">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="text-xs text-[#9CA3AF] capitalize">{p.name}</span>
          <span className="font-semibold text-white">{formatCurrency(p.value)}</span>
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
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">{label}</p>
        <div className="rounded-lg p-1.5" style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold" style={{ color }}>
        <AnimatedNumber value={value} formatter={formatCurrency} duration={900} />
      </p>
      {sub && <p className="mt-1 text-xs text-[#9CA3AF]">{sub}</p>}
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
                    ? "border-[#6366F1]/50 bg-[#6366F1]/20 text-[#818CF8]"
                    : "border-white/10 bg-white/5 text-[#9CA3AF] hover:text-white hover:bg-white/8"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </BlurFade>

        {isLoading && (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6366F1] border-t-transparent" />
          </div>
        )}

        {error && <QueryErrorState message={error.message} />}

        {data && !isLoading && (
          <>
            {/* KPI Row */}
            <BlurFade delay={0.1}>
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <KpiCard
                  label="Total Revenue"
                  value={data.summary.revenue}
                  color="#10B981"
                  icon={DollarSign}
                  sub={`${data.summary.salesCount} transactions · ${data.summary.unitsSold} units`}
                />
                <KpiCard
                  label="Cost of Goods"
                  value={data.summary.cogs}
                  color="#F59E0B"
                  icon={ShoppingCart}
                  sub="Total purchase cost of sold items"
                />
                <KpiCard
                  label="Gross Profit"
                  value={data.summary.grossProfit}
                  color={isLosingMoney ? "#F43F5E" : "#6366F1"}
                  icon={isLosingMoney ? TrendingDown : TrendingUp}
                  sub="Revenue minus cost of goods"
                />
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">Profit Margin</p>
                    <div className="rounded-lg p-1.5 bg-[#818CF8]/20">
                      <Percent className="h-4 w-4 text-[#818CF8]" />
                    </div>
                  </div>
                  <p className={`mt-3 text-2xl font-bold ${isLosingMoney ? "text-[#F43F5E]" : "text-[#818CF8]"}`}>
                    <AnimatedNumber value={data.summary.margin} formatter={(v) => `${v.toFixed(1)}%`} duration={900} />
                  </p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${isLosingMoney ? "bg-[#F43F5E]" : "bg-gradient-to-r from-[#6366F1] to-[#10B981]"}`}
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
                <h3 className="mb-1 text-sm font-medium text-[#9CA3AF]">Revenue vs Cost</h3>
                <p className="mb-5 text-base font-bold text-white">Sales Revenue & Cost of Goods Sold</p>
                {data.chartData.every((d) => d.revenue === 0) ? (
                  <div className="flex h-48 items-center justify-center text-[#9CA3AF] text-sm">
                    No sales data for this period
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={data.chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="cogsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toString()} />
                      <Tooltip content={<DarkTooltip />} />
                      <Area dataKey="revenue" name="Revenue" stroke="#6366F1" strokeWidth={2} fill="url(#revGrad)" dot={false} />
                      <Area dataKey="cogs" name="COGS" stroke="#F59E0B" strokeWidth={2} fill="url(#cogsGrad)" dot={false} />
                      <Area dataKey="profit" name="Profit" stroke="#10B981" strokeWidth={2} fill="url(#profitGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
                <div className="mt-3 flex gap-5 justify-center text-xs text-[#9CA3AF]">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#6366F1]" />Revenue</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#F59E0B]" />Cost of Goods</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#10B981]" />Gross Profit</span>
                </div>
              </div>
            </BlurFade>

            {/* Product Profitability Table */}
            <BlurFade delay={0.3}>
              <div className="glass rounded-2xl p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-[#9CA3AF]">Product Profitability</h3>
                    <p className="text-base font-bold text-white">Profit per product — cost to buy vs revenue earned</p>
                  </div>
                  <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-[#9CA3AF]">
                    {data.productBreakdown.length} products sold
                  </span>
                </div>

                {data.productBreakdown.length === 0 ? (
                  <div className="flex h-24 items-center justify-center text-[#9CA3AF] text-sm">
                    No sales recorded for this period
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/8">
                          <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-[#6B7280]">Product</th>
                          <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-[#6B7280]">Units Sold</th>
                          <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-[#6B7280]">Revenue</th>
                          <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-[#6B7280]">Cost (COGS)</th>
                          <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-[#6B7280]">Profit</th>
                          <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-[#6B7280]">Margin</th>
                          <th className="pb-3 pl-4 text-left text-xs font-medium uppercase tracking-wider text-[#6B7280]">Profit Bar</th>
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
                              className="hover:bg-white/3 transition-colors"
                            >
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-2.5">
                                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: p.categoryColor }} />
                                  <div>
                                    <p className="font-medium text-white">{p.productName}</p>
                                    <p className="text-xs text-[#9CA3AF]">{p.categoryName}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 text-right text-[#9CA3AF]">{p.unitsSold}</td>
                              <td className="py-3 text-right font-medium text-[#10B981]">{formatCurrency(p.revenue)}</td>
                              <td className="py-3 text-right text-[#F59E0B]">{formatCurrency(p.cogs)}</td>
                              <td className={`py-3 text-right font-semibold ${isNeg ? "text-[#F43F5E]" : "text-[#6366F1]"}`}>
                                {isNeg ? "-" : "+"}{formatCurrency(Math.abs(p.profit))}
                              </td>
                              <td className={`py-3 text-right text-xs font-medium ${isNeg ? "text-[#F43F5E]" : "text-[#9CA3AF]"}`}>
                                {p.margin.toFixed(1)}%
                              </td>
                              <td className="py-3 pl-4 w-32">
                                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                                  <motion.div
                                    className={`h-full rounded-full ${isNeg ? "bg-[#F43F5E]" : "bg-gradient-to-r from-[#6366F1] to-[#10B981]"}`}
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
                        <tr className="border-t border-white/10">
                          <td className="pt-3 text-sm font-semibold text-white">Total</td>
                          <td className="pt-3 text-right text-sm font-semibold text-[#9CA3AF]">{data.summary.unitsSold}</td>
                          <td className="pt-3 text-right text-sm font-semibold text-[#10B981]">{formatCurrency(data.summary.revenue)}</td>
                          <td className="pt-3 text-right text-sm font-semibold text-[#F59E0B]">{formatCurrency(data.summary.cogs)}</td>
                          <td className={`pt-3 text-right text-sm font-bold ${isLosingMoney ? "text-[#F43F5E]" : "text-[#6366F1]"}`}>
                            {isLosingMoney ? "-" : "+"}{formatCurrency(Math.abs(data.summary.grossProfit))}
                          </td>
                          <td className={`pt-3 text-right text-sm font-semibold ${isLosingMoney ? "text-[#F43F5E]" : "text-[#818CF8]"}`}>
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
                    <h3 className="mb-1 text-sm font-medium text-[#9CA3AF]">Category Breakdown</h3>
                    <p className="mb-5 text-base font-bold text-white">Profit by Category</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={catData} barGap={4} barSize={28}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toString()} />
                        <Tooltip content={<DarkTooltip />} />
                        <Bar dataKey="revenue" name="Revenue" fill="#6366F1" radius={[4, 4, 0, 0]} opacity={0.85} />
                        <Bar dataKey="cogs" name="Cost" fill="#F59E0B" radius={[4, 4, 0, 0]} opacity={0.85} />
                        <Bar dataKey="profit" name="Profit" fill="#10B981" radius={[4, 4, 0, 0]} opacity={0.9} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-3 flex gap-5 justify-center text-xs text-[#9CA3AF]">
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#6366F1]" />Revenue</span>
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#F59E0B]" />Cost</span>
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#10B981]" />Profit</span>
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
