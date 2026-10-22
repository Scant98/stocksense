"use client";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Download, ScanBarcode, Printer } from "lucide-react";
import { PageSpinner } from "@/components/layout/page-spinner";
import { Header } from "@/components/layout/header";
import { ProductTable } from "@/components/inventory/product-table";
import { ProductForm } from "@/components/inventory/product-form";
import { Button } from "@/components/ui/button";
import { ScanDialog } from "@/components/scanner/scan-dialog";
import { CodeGraphic } from "@/components/labels/code-graphic";
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
import { codeVariants } from "@/lib/barcode";
import { toast } from "sonner";

function csvCell(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function exportCsv(products: Product[]) {
  const header = ["Name", "Barcode", "SKU", "Category", "Quantity", "Reorder point", "Cost price", "Selling price", "Location"];
  const rows = products.map((p) => [
    p.name, p.barcode, p.sku, p.category.name, p.quantity, p.reorderPoint, p.unitPrice, p.sellingPrice, p.location,
  ]);
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function InventoryContent() {
  const router = useRouter();
  const params = useSearchParams();
  // Arriving from the POS with ?barcode=… means "add the product that just failed to scan".
  const pendingBarcode = params.get("barcode") ?? "";
  const [scanOpen, setScanOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [addOpen, setAddOpen] = useState(!!pendingBarcode);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const displayed = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        !!p.barcode?.toLowerCase().includes(q) ||
        !!p.sku?.toLowerCase().includes(q);
      const matchCategory = categoryFilter === "all" || p.categoryId === categoryFilter;
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [categoryFilter, products, searchQuery, statusFilter]);

  const handleAdd = async (data: Partial<Product>) => {
    try {
      await addProduct.mutateAsync(data);
      closeAdd();
      toast.success("Product added successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add product");
    }
  };

  const handleEdit = async (data: Partial<Product>) => {
    if (!editProduct) return;
    try {
      await updateProduct.mutateAsync({ id: editProduct.id, data });
      setEditProduct(null);
      toast.success("Product updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update product");
    }
  };

  const closeAdd = () => {
    setAddOpen(false);
    if (pendingBarcode) router.replace("/inventory");
  };

  const handleScanSearch = (code: string) => {
    const variants = codeVariants(code);
    const match = products.find((p) => variants.some((v) => p.barcode === v || p.sku === v));
    setSearchQuery(match ? (match.barcode ?? match.name) : variants[0] ?? code);
    if (!match) toast.error(`No product with code ${variants[0] ?? code}`);
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
      <PageSpinner />
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
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
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, barcode or SKU…"
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => setScanOpen(true)}>
            <ScanBarcode className="h-4 w-4" />
            Scan
          </Button>
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
          <Button variant="outline" onClick={() => exportCsv(displayed)} disabled={displayed.length === 0}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Summary badges */}
        <div className="flex gap-2 flex-wrap">
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
                  ? "border-primary/40 bg-primary/20 text-primary"
                  : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
              <span className="rounded-full bg-muted/60 px-1.5 py-0.5 text-[10px]">
                {item.count}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <ProductTable
          products={displayed}
          onEdit={setEditProduct}
          onDelete={(id) => setDeleteConfirm(id)}
          onView={setViewProduct}
        />
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={(open) => (open ? setAddOpen(true) : closeAdd())}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>Fill in the product details below.</DialogDescription>
          </DialogHeader>
          <ProductForm
            categories={categories}
            initialBarcode={pendingBarcode || undefined}
            onSubmit={handleAdd}
            onCancel={closeAdd}
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
                  ["Barcode", viewProduct.barcode || "—"],
                  ["SKU", viewProduct.sku || "—"],
                  ["Location", viewProduct.location || "—"],
                  ["Quantity", viewProduct.quantity.toString()],
                  ["Reorder Point", viewProduct.reorderPoint.toString()],
                  ["Cost Price", formatCurrency(viewProduct.unitPrice)],
                  ["Selling Price", formatCurrency(viewProduct.sellingPrice)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-muted/40 px-3 py-2.5">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium text-foreground">{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2.5">
                <div className="h-14 w-40 rounded bg-white p-1.5">
                  <CodeGraphic value={viewProduct.barcode || viewProduct.sku || viewProduct.id} kind="barcode" className="h-full w-full" />
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/labels?ids=${viewProduct.id}`}>
                    <Printer className="h-4 w-4" />
                    Print label
                  </Link>
                </Button>
              </div>
              {viewProduct.description && (
                <div className="rounded-xl bg-muted/40 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm text-foreground">{viewProduct.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ScanDialog open={scanOpen} onOpenChange={setScanOpen} onScan={handleScanSearch} title="Find a product by scanning" />

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
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={null}>
      <InventoryContent />
    </Suspense>
  );
}
