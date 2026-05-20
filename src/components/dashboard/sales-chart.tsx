"use client";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface DataPoint {
  month: string;
  sales: number;
  purchases: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl p-3 shadow-xl">
      <p className="mb-2 text-xs font-medium text-[#9CA3AF]">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-[#9CA3AF] capitalize">{entry.name}:</span>
          <span className="font-medium text-white">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  data?: DataPoint[];
}

export function SalesChart({ data = [] }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass rounded-2xl p-5"
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-[#9CA3AF]">Revenue Overview</h3>
          <p className="text-lg font-bold text-white">Sales & Purchases</p>
        </div>
        <div className="flex gap-4 text-xs text-[#9CA3AF]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#6366F1]" />Sales
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#10B981]" />Purchases
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="purchasesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: "#6B7280", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#6B7280", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="sales"
            stroke="#6366F1"
            strokeWidth={2}
            fill="url(#salesGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#6366F1" }}
          />
          <Area
            type="monotone"
            dataKey="purchases"
            stroke="#10B981"
            strokeWidth={2}
            fill="url(#purchasesGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#10B981" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
