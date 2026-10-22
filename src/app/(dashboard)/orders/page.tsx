"use client";
import { FormEvent, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, ArrowUpRight, Calendar, Package, Plus,
  TrendingUp, FileText, Eye, Printer, Trash2, ReceiptText,
} from "lucide-react";
import { PageSpinner } from "@/components/layout/page-spinner";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BlurFade } from "@/components/magic/blur-fade";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { InvoiceView } from "@/components/invoices/invoice-view";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  useCreateTransaction,
  useProducts,
  useTransactions,
  useInvoices,
  useCreateInvoice,
  useDeleteInvoice,
} from "@/hooks/use-api";
import type { Invoice } from "@/lib/types";
import { toast } from "sonner";

const typeColors = {
  purchase: "primary",
  sale: "success",
  adjustment: "warning",
  return: "muted",
} as const;

const invoiceStatusStyles: Record<string, string> = {
  draft:   "bg-muted/60 text-muted-foreground border-border",
  sent:    "bg-chart-3/15 text-chart-3 border-chart-3/20",
  paid:    "bg-success/15 text-success border-success/20",
  overdue: "bg-destructive/15 text-destructive border-destructive/20",
};

type Tab = "sales" | "invoices";

export default function OrdersPage() {
  const { data: transactions = [], isLoading } = useTransactions();
  const { data: products = [] } = useProducts();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const createTransaction = useCreateTransaction();
  const createInvoice = useCreateInvoice();
  const deleteInvoice = useDeleteInvoice();

  const [tab, setTab] = useState<Tab>("sales");

  // Sale form state
  const [saleOpen, setSaleOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  // Post-sale invoice prompt
  const [invoicePromptOpen, setInvoicePromptOpen] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<{ productName: string; quantity: number; unitPrice: number } | null>(null);

  // Invoice dialogs
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Derived data
  const sales = transactions.filter((t) => t.type === "sale");
  const totalSales = sales.reduce((s, t) => s + t.totalAmount, 0);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todaySales = useMemo(
    () => sales.filter((t) => new Date(t.createdAt) >= todayStart),
    [sales, todayStart]
  );
  const todayRevenue = todaySales.reduce((s, t) => s + t.totalAmount, 0);

  const topProductsToday = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const t of todaySales) {
      const existing = map.get(t.productId);
      if (existing) {
        existing.qty += t.quantity;
        existing.revenue += t.totalAmount;
      } else {
        map.set(t.productId, {
          name: t.product.name,
          qty: t.quantity,
          revenue: t.totalAmount,
        });
      }
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [todaySales]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [productId, products]
  );
  const saleQuantity = Number(quantity);
  const saleUnitPrice = Number(unitPrice || selectedProduct?.sellingPrice || 0);
  const saleTotal =
    Number.isFinite(saleQuantity) && Number.isFinite(saleUnitPrice)
      ? saleQuantity * saleUnitPrice
      : 0;

  const resetSaleForm = () => {
    setProductId("");
    setQuantity("1");
    setUnitPrice("");
    setReference("");
    setNotes("");
  };

  const handleSaleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProduct) { toast.error("Select a product"); return; }
    if (!Number.isFinite(saleQuantity) || saleQuantity <= 0) { toast.error("Enter a valid quantity"); return; }
    if (saleQuantity > selectedProduct.quantity) { toast.error("Not enough stock for this sale"); return; }
    if (!Number.isFinite(saleUnitPrice) || saleUnitPrice < 0) { toast.error("Enter a valid selling price"); return; }

    try {
      await createTransaction.mutateAsync({
        productId: selectedProduct.id,
        type: "sale",
        quantity: saleQuantity,
        unitPrice: saleUnitPrice,
        reference: reference.trim() || `SO-${Date.now()}`,
        notes: notes.trim(),
      });
      toast.success("Sale recorded and stock updated");
      setLastSaleData({
        productName: selectedProduct.name,
        quantity: saleQuantity,
        unitPrice: saleUnitPrice,
      });
      setSaleOpen(false);
      resetSaleForm();
      setInvoicePromptOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to record sale");
    }
  };

  const handleCreateInvoice = async (data: Partial<Invoice>) => {
    try {
      await createInvoice.mutateAsync(data);
      setInvoiceFormOpen(false);
      setTab("invoices");
      toast.success("Invoice created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create invoice");
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      await deleteInvoice.mutateAsync(id);
      setDeleteConfirm(null);
      toast.success("Invoice deleted");
    } catch {
      toast.error("Failed to delete invoice");
    }
  };

  const invoiceDefaultFromSale: Partial<Invoice> | undefined = lastSaleData
    ? {
        clientName: "",
        clientEmail: "",
        clientPhone: "",
        clientAddress: "",
        status: "draft",
        notes: "",
        tax: 0,
        items: [
          {
            id: "",
            invoiceId: "",
            description: lastSaleData.productName,
            quantity: lastSaleData.quantity,
            unitPrice: lastSaleData.unitPrice,
            total: lastSaleData.quantity * lastSaleData.unitPrice,
          },
        ],
        subtotal: lastSaleData.quantity * lastSaleData.unitPrice,
        total: lastSaleData.quantity * lastSaleData.unitPrice,
        dueDate: null,
      }
    : undefined;

  if (isLoading) {
    return (
      <PageSpinner />
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
      <Header
        title="Orders & Sales"
        subtitle={`${sales.length} total sales · ${formatCurrency(totalSales)} revenue`}
        action={
          <Button onClick={() => setSaleOpen(true)}>
            <Plus className="h-4 w-4" />
            Record Sale
          </Button>
        }
      />

      <div className="p-6 space-y-5">
        {/* Summary Stats */}
        <BlurFade delay={0.05}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Today's Revenue", value: formatCurrency(todayRevenue), icon: TrendingUp, color: "var(--success)" },
              { label: "Sales Today", value: todaySales.length.toString(), icon: ShoppingCart, color: "var(--primary)" },
              { label: "Total Sales", value: sales.length.toString(), icon: ArrowUpRight, color: "var(--chart-3)" },
              { label: "Total Revenue", value: formatCurrency(totalSales), icon: Package, color: "var(--warning)" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.07 + i * 0.06 }}
                className="glass rounded-2xl p-5 flex items-center gap-4"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: s.color + "20" }}>
                  <s.icon className="h-5 w-5" style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </BlurFade>

        {/* Today's Top Products */}
        {topProductsToday.length > 0 && (
          <BlurFade delay={0.15}>
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <h3 className="font-semibold text-foreground">Top Products Today</h3>
              </div>
              <div className="p-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {topProductsToday.map((p, i) => (
                  <motion.div
                    key={p.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.18 + i * 0.05 }}
                    className="rounded-xl bg-muted/40 px-4 py-3 border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">#{i + 1}</span>
                      <span className="text-xs font-semibold text-success">{p.qty} sold</span>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(p.revenue)}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </BlurFade>
        )}

        {/* Tabs */}
        <BlurFade delay={0.2}>
          <div className="flex gap-1 rounded-xl bg-muted/40 p-1 w-fit border border-border">
            {(["sales", "invoices"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  tab === t
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "sales" ? <ShoppingCart className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                {t === "sales" ? "Sales History" : "Invoices"}
                {t === "invoices" && invoices.length > 0 && (
                  <span className="rounded-full bg-muted/80 px-1.5 py-0.5 text-[10px]">
                    {invoices.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </BlurFade>

        {/* Sales History Tab */}
        <AnimatePresence mode="wait">
          {tab === "sales" && (
            <motion.div
              key="sales"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="glass rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">All Transactions</h3>
                  <span className="text-xs text-muted-foreground">{transactions.length} records</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/20">
                        {["Reference", "Product", "Type", "Qty", "Unit Price", "Total", "Date"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((txn, i) => (
                        <motion.tr
                          key={txn.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25 + i * 0.03 }}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{txn.reference}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">{txn.product.name}</p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={typeColors[txn.type as keyof typeof typeColors] ?? "muted"} className="capitalize">{txn.type}</Badge>
                          </td>
                          <td className="px-4 py-3 text-foreground">{txn.quantity}</td>
                          <td className="px-4 py-3 text-foreground">{formatCurrency(txn.unitPrice)}</td>
                          <td className={`px-4 py-3 font-semibold ${txn.type === "sale" ? "text-success" : "text-foreground"}`}>
                            {formatCurrency(Math.abs(txn.totalAmount))}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3" />
                              {formatDate(txn.createdAt)}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                  {transactions.length === 0 && (
                    <p className="px-5 py-10 text-center text-sm text-muted-foreground">No transactions yet</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Invoices Tab */}
          {tab === "invoices" && (
            <motion.div
              key="invoices"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="glass rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ReceiptText className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">Invoices</h3>
                  </div>
                  <Button size="sm" onClick={() => setInvoiceFormOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    New Invoice
                  </Button>
                </div>

                {invoicesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="py-16 text-center">
                    <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No invoices yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">Record a sale and choose to generate an invoice</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50 bg-muted/20">
                          {["Invoice #", "Client", "Status", "Amount", "Date", ""].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((inv, i) => (
                          <motion.tr
                            key={inv.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-4 py-3 font-mono text-xs text-primary">{inv.invoiceNumber}</td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-foreground">{inv.clientName || "—"}</p>
                              {inv.clientPhone && <p className="text-xs text-muted-foreground">{inv.clientPhone}</p>}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${invoiceStatusStyles[inv.status]}`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-foreground">{formatCurrency(inv.total)}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3 w-3" />
                                {formatDate(inv.createdAt)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 justify-end">
                                <Button variant="ghost" size="icon" onClick={() => setViewInvoice(inv)} title="View invoice">
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-destructive"
                                  onClick={() => setDeleteConfirm(inv.id)}
                                  title="Delete invoice"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Record Sale Dialog */}
      <Dialog open={saleOpen} onOpenChange={(open) => { setSaleOpen(open); if (!open) resetSaleForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Sale</DialogTitle>
            <DialogDescription>Select a product and quantity. Stock updates automatically.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Product</label>
              <Select
                value={productId}
                onValueChange={(value) => {
                  const product = products.find((p) => p.id === value);
                  setProductId(value);
                  setUnitPrice(product ? String(product.sellingPrice) : "");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id} disabled={product.quantity <= 0}>
                      {product.name} · {product.quantity} in stock
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  max={selectedProduct?.quantity ?? undefined}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Unit Price (TZS)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Customer / Notes</label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Customer name or note"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Total</label>
                <div className="flex h-10 items-center rounded-xl border border-border bg-muted/40 px-3 text-sm font-semibold text-foreground">
                  {formatCurrency(saleTotal)}
                </div>
              </div>
            </div>

            {selectedProduct && (
              <p className="text-xs text-muted-foreground">
                Stock after sale: {Math.max(0, selectedProduct.quantity - (Number.isFinite(saleQuantity) ? saleQuantity : 0))} remaining
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setSaleOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createTransaction.isPending}>
                {createTransaction.isPending ? "Saving..." : "Save Sale"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Post-Sale Invoice Prompt */}
      <Dialog open={invoicePromptOpen} onOpenChange={setInvoicePromptOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Create Invoice?
            </DialogTitle>
            <DialogDescription>
              Sale recorded successfully. Would you like to generate a printable invoice for this sale?
            </DialogDescription>
          </DialogHeader>
          {lastSaleData && (
            <div className="rounded-xl bg-muted/40 border border-border px-4 py-3 mb-2">
              <p className="text-sm font-medium text-foreground">{lastSaleData.productName}</p>
              <p className="text-xs text-muted-foreground">
                {lastSaleData.quantity} × {formatCurrency(lastSaleData.unitPrice)} = {formatCurrency(lastSaleData.quantity * lastSaleData.unitPrice)}
              </p>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setInvoicePromptOpen(false)}>
              Skip
            </Button>
            <Button onClick={() => {
              setInvoicePromptOpen(false);
              setInvoiceFormOpen(true);
              setTab("invoices");
            }}>
              <FileText className="h-4 w-4" />
              Create Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Form Dialog */}
      <Dialog open={invoiceFormOpen} onOpenChange={setInvoiceFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Invoice</DialogTitle>
            <DialogDescription>Fill in client details and confirm the line items.</DialogDescription>
          </DialogHeader>
          <InvoiceForm
            invoice={invoiceDefaultFromSale as Invoice | undefined}
            onSubmit={handleCreateInvoice}
            onCancel={() => setInvoiceFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Invoice View Dialog (with print) */}
      <Dialog open={!!viewInvoice} onOpenChange={(o) => !o && setViewInvoice(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-4 w-4 text-primary" />
              {viewInvoice?.invoiceNumber}
            </DialogTitle>
          </DialogHeader>
          {viewInvoice && <InvoiceView invoice={viewInvoice} />}
        </DialogContent>
      </Dialog>

      {/* Delete Invoice Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDeleteInvoice(deleteConfirm)}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
