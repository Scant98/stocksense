"use client";
import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, ArrowDownLeft, ArrowUpRight, Calendar, Package, Plus } from "lucide-react";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import { useCreateTransaction, useProducts, useTransactions } from "@/hooks/use-api";
import { toast } from "sonner";

const typeColors = {
  purchase: "primary",
  sale: "success",
  adjustment: "warning",
  return: "muted",
} as const;

export default function OrdersPage() {
  const { data: transactions = [], isLoading } = useTransactions();
  const { data: products = [] } = useProducts();
  const createTransaction = useCreateTransaction();
  const [saleOpen, setSaleOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const purchases = transactions.filter((t) => t.type === "purchase");
  const sales = transactions.filter((t) => t.type === "sale");
  const totalSpend = purchases.reduce((s, t) => s + t.totalAmount, 0);
  const totalSales = sales.reduce((s, t) => s + t.totalAmount, 0);
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId),
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
    if (!selectedProduct) {
      toast.error("Select a product");
      return;
    }
    if (!Number.isFinite(saleQuantity) || saleQuantity <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    if (saleQuantity > selectedProduct.quantity) {
      toast.error("Not enough stock for this sale");
      return;
    }
    if (!Number.isFinite(saleUnitPrice) || saleUnitPrice < 0) {
      toast.error("Enter a valid selling price");
      return;
    }

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
      setSaleOpen(false);
      resetSaleForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to record sale");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6366F1] border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
      <Header
        title="Orders"
        subtitle={`${sales.length} sales · ${purchases.length} purchase orders`}
        action={
          <Button onClick={() => setSaleOpen(true)}>
            <Plus className="h-4 w-4" />
            Record Sale
          </Button>
        }
      />

      <div className="p-6 space-y-5">
        {/* Summary */}
        <BlurFade delay={0.1}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Sales Orders", value: sales.length.toString(), icon: ShoppingCart, color: "#6366F1" },
              { label: "Sales Revenue", value: formatCurrency(totalSales), icon: ArrowUpRight, color: "#10B981" },
              { label: "Total Spend", value: formatCurrency(totalSpend), icon: ArrowDownLeft, color: "#F43F5E" },
              { label: "Avg. Sale", value: formatCurrency(totalSales / (sales.length || 1)), icon: Package, color: "#F59E0B" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className="glass rounded-2xl p-5 flex items-center gap-4"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: s.color + "20" }}>
                  <s.icon className="h-5 w-5" style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-xs text-[#9CA3AF]">{s.label}</p>
                  <p className="text-lg font-bold text-white">{s.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </BlurFade>

        {/* Transactions Table */}
        <BlurFade delay={0.2}>
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8">
              <h3 className="font-semibold text-white">All Transactions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2">
                    {["Reference", "Product", "Type", "Qty", "Unit Price", "Total", "Date"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn, i) => (
                    <motion.tr
                      key={txn.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + i * 0.04 }}
                      className="border-b border-white/5 hover:bg-white/3 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-[#9CA3AF]">{txn.reference}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{txn.product.name}</p>
                        <p className="text-xs text-[#9CA3AF]">{txn.product.sku}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={typeColors[txn.type as keyof typeof typeColors] ?? "muted"} className="capitalize">{txn.type}</Badge>
                      </td>
                      <td className="px-4 py-3 text-white">{txn.quantity}</td>
                      <td className="px-4 py-3 text-white">{formatCurrency(txn.unitPrice)}</td>
                      <td className={`px-4 py-3 font-semibold ${txn.type === "sale" ? "text-[#10B981]" : txn.totalAmount < 0 ? "text-[#F43F5E]" : "text-white"}`}>
                        {formatCurrency(Math.abs(txn.totalAmount))}
                      </td>
                      <td className="px-4 py-3 text-[#9CA3AF] text-xs">
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
                <p className="px-5 py-10 text-center text-sm text-[#9CA3AF]">No transactions yet</p>
              )}
            </div>
          </div>
        </BlurFade>
      </div>

      <Dialog open={saleOpen} onOpenChange={(open) => {
        setSaleOpen(open);
        if (!open) resetSaleForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Sale</DialogTitle>
            <DialogDescription>Select a product and quantity. Stock will update when the sale is saved.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9CA3AF]">Product</label>
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
                <label className="mb-1.5 block text-xs font-medium text-[#9CA3AF]">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  max={selectedProduct?.quantity ?? undefined}
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#9CA3AF]">Unit Price</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitPrice}
                  onChange={(event) => setUnitPrice(event.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#9CA3AF]">Reference</label>
                <Input
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#9CA3AF]">Total</label>
                <div className="flex h-10 items-center rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white">
                  {formatCurrency(saleTotal)}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9CA3AF]">Notes</label>
              <Input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Customer name or sale note"
              />
            </div>

            {selectedProduct && (
              <p className="text-xs text-[#9CA3AF]">
                Current stock: {selectedProduct.quantity}. Remaining after sale:{" "}
                {Math.max(0, selectedProduct.quantity - (Number.isFinite(saleQuantity) ? saleQuantity : 0))}.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setSaleOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTransaction.isPending}>
                {createTransaction.isPending ? "Saving..." : "Save Sale"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
