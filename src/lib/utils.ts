import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("sw-TZ", {
    style: "currency",
    currency: "TZS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** "TSh 63.3M": short form for narrow cards on phones. */
export function formatCompactCurrency(amount: number): string {
  return (
    "TSh " +
    new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(amount)
  );
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en").format(n);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function getStockStatus(quantity: number, reorderPoint: number) {
  if (quantity === 0) return "out_of_stock";
  if (quantity <= reorderPoint) return "low_stock";
  if (quantity <= reorderPoint * 1.5) return "warning";
  return "in_stock";
}

export function getStatusColor(status: string) {
  switch (status) {
    case "in_stock": return "success";
    case "warning": return "warning";
    case "low_stock": return "danger";
    case "out_of_stock": return "danger";
    default: return "muted";
  }
}
