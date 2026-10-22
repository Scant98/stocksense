"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, FileText } from "lucide-react";
import { PageSpinner } from "@/components/layout/page-spinner";
import { Header } from "@/components/layout/header";
import { InvoiceTable } from "@/components/invoices/invoice-table";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { InvoiceView } from "@/components/invoices/invoice-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useInvoices, useCreateInvoice, useUpdateInvoice, useDeleteInvoice } from "@/hooks/use-api";
import type { Invoice } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
];

export default function InvoicesPage() {
  const { data: invoices = [], isLoading } = useInvoices();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      !search ||
      inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((s, inv) => s + inv.total, 0);

  const outstanding = invoices
    .filter((inv) => inv.status === "sent" || inv.status === "overdue")
    .reduce((s, inv) => s + inv.total, 0);

  const handleCreate = async (data: Partial<Invoice>) => {
    try {
      await createInvoice.mutateAsync(data);
      setAddOpen(false);
      toast.success("Invoice created");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(msg);
    }
  };

  const handleUpdate = async (data: Partial<Invoice>) => {
    if (!editInvoice) return;
    try {
      await updateInvoice.mutateAsync({ id: editInvoice.id, data });
      setEditInvoice(null);
      toast.success("Invoice updated");
    } catch {
      toast.error("Failed to update invoice");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInvoice.mutateAsync(id);
      setDeleteConfirm(null);
      toast.success("Invoice deleted");
    } catch {
      toast.error("Failed to delete invoice");
    }
  };

  if (isLoading) {
    return (
      <PageSpinner />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Header
        title="Invoices"
        subtitle={`${invoices.length} invoices · ${formatCurrency(totalRevenue)} collected`}
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {[
            { label: "Total Invoices", value: invoices.length.toString(), accent: "text-foreground" },
            { label: "Collected (Paid)", value: formatCurrency(totalRevenue), accent: "text-success" },
            { label: "Outstanding", value: formatCurrency(outstanding), accent: "text-warning" },
            {
              label: "Overdue",
              value: invoices.filter((i) => i.status === "overdue").length.toString(),
              accent: "text-destructive",
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-muted/30 px-4 py-3">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`mt-1 text-lg font-semibold ${stat.accent}`}>{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3"
        >
          <div className="relative flex-1 min-w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by client or invoice number..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Status badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex gap-2 flex-wrap"
        >
          {STATUS_FILTERS.map((f) => {
            const count =
              f.value === "all"
                ? invoices.length
                : invoices.filter((i) => i.status === f.value).length;
            return (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === f.value
                    ? "border-primary/40 bg-primary/20 text-primary"
                    : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
                <span className="rounded-full bg-muted/60 px-1.5 py-0.5 text-[10px]">{count}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Table */}
        <InvoiceTable
          invoices={filtered}
          onView={setViewInvoice}
          onEdit={setEditInvoice}
          onDelete={(id) => setDeleteConfirm(id)}
        />
      </div>

      {/* Create Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Invoice</DialogTitle>
            <DialogDescription>Fill in client details and line items.</DialogDescription>
          </DialogHeader>
          <InvoiceForm onSubmit={handleCreate} onCancel={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editInvoice} onOpenChange={(o) => !o && setEditInvoice(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
            <DialogDescription>Update invoice details.</DialogDescription>
          </DialogHeader>
          {editInvoice && (
            <InvoiceForm
              invoice={editInvoice}
              onSubmit={handleUpdate}
              onCancel={() => setEditInvoice(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewInvoice} onOpenChange={(o) => !o && setViewInvoice(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                {viewInvoice?.invoiceNumber}
              </span>
            </DialogTitle>
          </DialogHeader>
          {viewInvoice && <InvoiceView invoice={viewInvoice} />}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The invoice will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
