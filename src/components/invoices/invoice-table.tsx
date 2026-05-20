"use client";
import { motion } from "framer-motion";
import { Eye, Pencil, Trash2, FileText } from "lucide-react";
import type { Invoice, InvoiceStatus } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  draft: "bg-[#6B7280]/20 text-[#9CA3AF] border-[#6B7280]/30",
  sent: "bg-[#3B82F6]/20 text-[#60A5FA] border-[#3B82F6]/30",
  paid: "bg-[#10B981]/20 text-[#34D399] border-[#10B981]/30",
  overdue: "bg-[#F43F5E]/20 text-[#FB7185] border-[#F43F5E]/30",
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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-white/3 py-20 text-center">
        <FileText className="mb-3 h-10 w-10 text-[#374151]" />
        <p className="text-sm font-medium text-[#9CA3AF]">No invoices yet</p>
        <p className="mt-1 text-xs text-[#6B7280]">Create your first invoice to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/8">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/8 bg-white/3">
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280]">Invoice #</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280]">Client</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280]">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280]">Due Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280]">Status</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[#6B7280]">Total</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[#6B7280]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv, i) => (
            <motion.tr
              key={inv.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="border-b border-white/5 hover:bg-white/3 transition-colors"
            >
              <td className="px-4 py-3">
                <span className="font-mono text-sm font-medium text-[#818CF8]">
                  {inv.invoiceNumber}
                </span>
              </td>
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-white">{inv.clientName}</p>
                {inv.clientEmail && (
                  <p className="text-xs text-[#6B7280]">{inv.clientEmail}</p>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-[#9CA3AF]">
                {formatDate(inv.createdAt)}
              </td>
              <td className="px-4 py-3 text-sm text-[#9CA3AF]">
                {inv.dueDate ? formatDate(inv.dueDate) : "—"}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[inv.status]}`}
                >
                  {inv.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-sm font-semibold text-white">
                {formatCurrency(inv.total)}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => onView(inv)}
                    className="rounded-lg p-1.5 text-[#6B7280] hover:text-[#818CF8] hover:bg-[#6366F1]/10 transition-colors"
                    title="View"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onEdit(inv)}
                    className="rounded-lg p-1.5 text-[#6B7280] hover:text-white hover:bg-white/10 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(inv.id)}
                    className="rounded-lg p-1.5 text-[#6B7280] hover:text-[#F43F5E] hover:bg-[#F43F5E]/10 transition-colors"
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
