"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Settings,
  ShoppingCart,
  AlertTriangle,
  ChevronRight,
  LogOut,
  Tag,
} from "lucide-react";
import { SparklesText } from "@/components/magic/sparkles-text";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-api";
import { logout } from "@/app/actions/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/categories", label: "Categories", icon: Tag },
  { href: "/orders", label: "Orders & Sales", icon: ShoppingCart },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: user } = useUser();

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col glass-strong border-r border-white/8 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/8">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#6366F1] shadow-lg shadow-[rgba(99,102,241,0.4)]">
          <Package className="h-5 w-5 text-white" />
          <motion.div
            className="absolute inset-0 rounded-xl bg-[#6366F1] opacity-60"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        <SparklesText text="StockSense" className="text-xl" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "text-white"
                    : "text-[#9CA3AF] hover:text-white hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-xl bg-[#6366F1]/20 border border-[#6366F1]/30"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon
                  className={cn(
                    "relative h-4 w-4 shrink-0",
                    isActive ? "text-[#818CF8]" : "text-[#6B7280]"
                  )}
                />
                <span className="relative flex-1">{item.label}</span>
                {isActive && (
                  <ChevronRight className="relative h-3.5 w-3.5 text-[#6366F1]" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/8 px-4 py-4">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#6366F1] to-[#818CF8] flex items-center justify-center text-xs font-bold text-white shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name ?? "Loading…"}</p>
            <p className="truncate text-xs text-[#9CA3AF] capitalize">{user?.role ?? "user"}</p>
          </div>
          <button
            onClick={() => logout()}
            title="Sign out"
            className="text-[#9CA3AF] hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
