"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Phone, Mail, MapPin, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { PageSpinner } from "@/components/layout/page-spinner";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BlurFade } from "@/components/magic/blur-fade";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import {
  useSuppliers,
  useProducts,
  useAddSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from "@/hooks/use-api";
import type { Supplier } from "@/lib/types";
import { toast } from "sonner";

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: suppliers = [], isLoading } = useSuppliers();
  const { data: products = [] } = useProducts();
  const addMutation = useAddSupplier();
  const updateMutation = useUpdateSupplier();
  const deleteMutation = useDeleteSupplier();

  const filtered = suppliers.filter(
    (s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (data: Partial<Supplier>) => {
    try {
      await addMutation.mutateAsync(data);
      setAddOpen(false);
      toast.success("Supplier added successfully");
    } catch {
      toast.error("Failed to add supplier");
    }
  };

  const handleEdit = async (data: Partial<Supplier>) => {
    if (!editSupplier) return;
    try {
      await updateMutation.mutateAsync({ id: editSupplier.id, data });
      setEditSupplier(null);
      toast.success("Supplier updated");
    } catch {
      toast.error("Failed to update supplier");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteConfirm(null);
      toast.success("Supplier deleted");
    } catch {
      toast.error("Failed to delete supplier");
    }
  };

  if (isLoading) {
    return (
      <PageSpinner />
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
      <Header
        title="Suppliers"
        subtitle={`${suppliers.length} registered suppliers`}
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Supplier
          </Button>
        }
      />

      <div className="p-6 space-y-5">
        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative max-w-sm"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </motion.div>

        {/* Supplier Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((supplier, i) => {
            const supplierProducts = products.filter((p) => p.supplierId === supplier.id);
            const totalValue = supplierProducts.reduce(
              (s, p) => s + p.quantity * p.unitPrice,
              0
            );

            return (
              <BlurFade key={supplier.id} delay={0.1 + i * 0.07}>
                <motion.div
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="glass rounded-2xl p-5 transition-shadow"
                >
                  {/* Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-base font-bold text-primary-foreground">
                        {supplier.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{supplier.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {Array.from({ length: 5 }, (_, j) => (
                            <Star
                              key={j}
                              className={`h-3 w-3 ${
                                j < Math.floor(supplier.rating)
                                  ? "fill-warning text-warning"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-xs text-muted-foreground">{supplier.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={supplier.status === "active" ? "success" : "muted"}>
                        {supplier.status}
                      </Badge>
                      <button
                        onClick={() => setEditSupplier(supplier)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(supplier.id)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="mb-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                    {supplier.phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.address && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{supplier.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 border-t border-border pt-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{supplier.totalOrders}</p>
                      <p className="text-[10px] text-muted-foreground">Orders</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{supplierProducts.length}</p>
                      <p className="text-[10px] text-muted-foreground">Products</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-success">
                        {(totalValue / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-[10px] text-muted-foreground">Stock Val.</p>
                    </div>
                  </div>
                </motion.div>
              </BlurFade>
            );
          })}

          {filtered.length === 0 && (
            <p className="col-span-3 py-16 text-center text-sm text-muted-foreground">
              No suppliers found
            </p>
          )}
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogDescription>Fill in the supplier details below.</DialogDescription>
          </DialogHeader>
          <SupplierForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editSupplier} onOpenChange={(o) => !o && setEditSupplier(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>Update supplier information.</DialogDescription>
          </DialogHeader>
          {editSupplier && (
            <SupplierForm
              supplier={editSupplier}
              onSubmit={handleEdit}
              onCancel={() => setEditSupplier(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Supplier</DialogTitle>
            <DialogDescription>
              This will permanently remove the supplier. Products linked to this supplier will be affected.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
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
