"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Download } from "lucide-react";
import { Header } from "@/components/layout/header";
import { ProductTable } from "@/components/inventory/product-table";
import { ProductForm } from "@/components/inventory/product-form";
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
import {
  useAddProduct,
  useCategories,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "@/hooks/use-api";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const displayed = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === "all" || p.categoryId === categoryFilter;
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [categoryFilter, products, searchQuery, statusFilter]);

  const handleAdd = async (data: Partial<Product>) => {
    try {
      await addProduct.mutateAsync(data);
      setAddOpen(false);
      toast.success("Product added successfully");
    } catch {
      toast.error("Failed to add product");
    }
  };

  const handleEdit = async (data: Partial<Product>) => {
    if (!editProduct) return;
    try {
      await updateProduct.mutateAsync({ id: editProduct.id, data });
      setEditProduct(null);
      toast.success("Product updated");
    } catch {
      toast.error("Failed to update product");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct.mutateAsync(id);
      setDeleteConfirm(null);
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const totalValue = displayed.reduce((s, p) => s + p.quantity * p.sellingPrice, 0);

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
        title="Inventory"
        subtitle={`${displayed.length} products · ${formatCurrency(totalValue)} total value`}
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3"
        >
          <div className="relative flex-1 min-w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <Input
              placeholder="Search products..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="warning">Low Soon</SelectItem>
              <SelectItem value="low_stock">Low Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="md">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </motion.div>

        {/* Summary badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 flex-wrap"
        >
          {[
            { label: "All", value: "all", count: products.length },
            { label: "In Stock", value: "in_stock", count: products.filter(p => p.status === "in_stock").length },
            { label: "Low Stock", value: "low_stock", count: products.filter(p => p.status === "low_stock").length },
            { label: "Out of Stock", value: "out_of_stock", count: products.filter(p => p.status === "out_of_stock").length },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setStatusFilter(item.value)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === item.value
                  ? "border-[#6366F1]/40 bg-[#6366F1]/20 text-[#818CF8]"
                  : "border-white/10 bg-white/5 text-[#9CA3AF] hover:text-white"
              }`}
            >
              {item.label}
              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">
                {item.count}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Table */}
        <ProductTable
          products={displayed}
          onEdit={setEditProduct}
          onDelete={(id) => setDeleteConfirm(id)}
          onView={setViewProduct}
        />
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>Fill in the product details below.</DialogDescription>
          </DialogHeader>
          <ProductForm
            categories={categories}
            onSubmit={handleAdd}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editProduct} onOpenChange={(o) => !o && setEditProduct(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product information.</DialogDescription>
          </DialogHeader>
          {editProduct && (
            <ProductForm
              product={editProduct}
              categories={categories}
              onSubmit={handleEdit}
              onCancel={() => setEditProduct(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewProduct} onOpenChange={(o) => !o && setViewProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {viewProduct && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Name", viewProduct.name],
                  ["Category", viewProduct.category.name],
                  ["Quantity", viewProduct.quantity.toString()],
                  ["Reorder Point", viewProduct.reorderPoint.toString()],
                  ["Cost Price", formatCurrency(viewProduct.unitPrice)],
                  ["Selling Price", formatCurrency(viewProduct.sellingPrice)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-white/5 px-3 py-2.5">
                    <p className="text-xs text-[#9CA3AF]">{label}</p>
                    <p className="text-sm font-medium text-white">{value}</p>
                  </div>
                ))}
              </div>
              {viewProduct.description && (
                <div className="rounded-xl bg-white/5 px-3 py-2.5">
                  <p className="text-xs text-[#9CA3AF]">Description</p>
                  <p className="text-sm text-white">{viewProduct.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The product will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
