"use client";
import { motion } from "framer-motion";
import { Eye, Pencil, Trash2, FileText } from "lucide-react";
import type { Invoice, InvoiceStatus } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  draft: "bg-muted/60 text-muted-foreground border-border",
  sent: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  paid: "bg-success/20 text-success border-success/30",
  overdue: "bg-destructive/20 text-destructive border-destructive/30",
};

interface InvoiceTableProps {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (id: string) => void;
}

export function InvoiceTable({ invoices, onView, onEdit, onDelete }: InvoiceTableProps) {
  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-muted/30 py-20 text-center">
        <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">No invoices yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Create your first invoice to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Invoice #</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Client</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Due Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Total</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv, i) => (
            <motion.tr
              key={inv.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="border-b border-border/50 hover:bg-muted/30 transition-colors"
            >
              <td className="px-4 py-3">
                <span className="font-mono text-sm font-medium text-primary">
                  {inv.invoiceNumber}
                </span>
              </td>
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-foreground">{inv.clientName}</p>
                {inv.clientEmail && (
                  <p className="text-xs text-muted-foreground">{inv.clientEmail}</p>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {formatDate(inv.createdAt)}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {inv.dueDate ? formatDate(inv.dueDate) : "—"}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[inv.status]}`}
                >
                  {inv.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                {formatCurrency(inv.total)}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => onView(inv)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title="View"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onEdit(inv)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(inv.id)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
