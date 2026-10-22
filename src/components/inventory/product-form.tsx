"use client";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, ScanBarcode, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScanDialog } from "@/components/scanner/scan-dialog";
import { useAddCategory } from "@/hooks/use-api";
import { generateEan13, normalizeCode } from "@/lib/barcode";
import type { Product, Category } from "@/lib/types";
import { getStockStatus } from "@/lib/utils";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  location: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  quantity: z.number().min(0, "Quantity must be 0 or more"),
  reorderPoint: z.number().min(1, "Reorder point required"),
  unitPrice: z.number().min(1, "Unit price required"),
  sellingPrice: z.number().min(1, "Selling price required"),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const CATEGORY_COLORS = [
  "#64748B", "#10B981", "#F59E0B", "#F43F5E", "#D946EF", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#78716C", "#84CC16", "#EAB308",
];

interface ProductFormProps {
  product?: Product;
  /** Pre-fill the barcode when creating a product from an unknown scan. */
  initialBarcode?: string;
  categories: Category[];
  onSubmit: (data: Partial<Product>) => void;
  onCancel: () => void;
}

export function ProductForm({
  product,
  initialBarcode,
  categories = [],
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState(CATEGORY_COLORS[0]);
  const [scanOpen, setScanOpen] = useState(false);
  const [createdCategories, setCreatedCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(product?.categoryId ?? "");
  const addCategory = useAddCategory();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: product
      ? {
          name: product.name,
          barcode: product.barcode ?? "",
          sku: product.sku ?? "",
          location: product.location ?? "",
          categoryId: product.categoryId,
          quantity: product.quantity,
          reorderPoint: product.reorderPoint,
          unitPrice: product.unitPrice,
          sellingPrice: product.sellingPrice,
          description: product.description,
        }
      : { quantity: 0, reorderPoint: 10, barcode: initialBarcode ?? "" },
  });

  const selectableCategories = useMemo(() => {
    const byId = new Map<string, Category>();
    for (const category of [...categories, ...createdCategories]) {
      byId.set(category.id, category);
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, createdCategories]);

  const onFormSubmit = (data: FormData) => {
    const submitData: Partial<Product> = {
      name: data.name,
      barcode: data.barcode?.trim() || undefined,
      sku: data.sku?.trim() || undefined,
      location: data.location?.trim() || "",
      quantity: data.quantity,
      reorderPoint: data.reorderPoint,
      unitPrice: data.unitPrice,
      sellingPrice: data.sellingPrice,
      categoryId: data.categoryId,
      description: data.description || "",
      status: getStockStatus(data.quantity, data.reorderPoint),
      lastRestocked: new Date().toISOString(),
    };
    onSubmit(submitData);
  };

  const handleCreateCategory = async () => {
    const trimmedName = categoryName.trim();
    if (!trimmedName) {
      toast.error("Category name is required");
      return;
    }

    try {
      const category = await addCategory.mutateAsync({
        name: trimmedName,
        color: categoryColor,
      });
      setCreatedCategories((current) => [...current, category]);
      setSelectedCategoryId(category.id);
      setValue("categoryId", category.id, { shouldValidate: true });
      setCategoryOpen(false);
      setCategoryName("");
      setCategoryColor(CATEGORY_COLORS[0]);
      toast.success("Category created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create category");
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Product Name</label>
          <Input {...register("name")} placeholder="e.g. Samsung Galaxy A54" />
          {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Barcode / QR code {!product && <span className="font-normal">(leave empty to generate one)</span>}
          </label>
          <div className="flex gap-2">
            <Input
              {...register("barcode")}
              placeholder="Scan or type the code on the product"
              autoComplete="off"
              inputMode="text"
              // Scanner guns finish with Enter; don't let that submit the form.
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            />
            <Button type="button" variant="outline" onClick={() => setScanOpen(true)}>
              <ScanBarcode className="h-4 w-4" />
              Scan
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setValue("barcode", generateEan13(), { shouldDirty: true })}
              title="Generate an in-store barcode"
            >
              <Wand2 className="h-4 w-4" />
              <span className="hidden sm:inline">Generate</span>
            </Button>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">SKU (optional)</label>
          <Input {...register("sku")} placeholder="e.g. PT-BSH-001" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Shelf / Location (optional)</label>
          <Input {...register("location")} placeholder="e.g. Aisle 3, Shelf B" />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label className="block text-xs font-medium text-muted-foreground">Category</label>
            <button
              type="button"
              onClick={() => setCategoryOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-foreground"
            >
              <Plus className="h-3 w-3" />
              New
            </button>
          </div>
          <Select
            value={selectedCategoryId}
            onValueChange={(v) => {
              setSelectedCategoryId(v);
              setValue("categoryId", v, { shouldValidate: true });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {selectableCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && <p className="mt-1 text-xs text-destructive">{errors.categoryId.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Quantity</label>
          <Input type="number" {...register("quantity", { valueAsNumber: true })} placeholder="0" />
          {errors.quantity && <p className="mt-1 text-xs text-destructive">{errors.quantity.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Reorder Point</label>
          <Input type="number" {...register("reorderPoint", { valueAsNumber: true })} placeholder="10" />
          {errors.reorderPoint && <p className="mt-1 text-xs text-destructive">{errors.reorderPoint.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Cost Price (TZS)</label>
          <Input type="number" {...register("unitPrice", { valueAsNumber: true })} placeholder="50000" />
          {errors.unitPrice && <p className="mt-1 text-xs text-destructive">{errors.unitPrice.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Selling Price (TZS)</label>
          <Input type="number" {...register("sellingPrice", { valueAsNumber: true })} placeholder="75000" />
          {errors.sellingPrice && <p className="mt-1 text-xs text-destructive">{errors.sellingPrice.message}</p>}
        </div>
        <div className="col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description (optional)</label>
          <Input {...register("description")} placeholder="Product description..." />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{product ? "Update Product" : "Add Product"}</Button>
      </div>
    </form>

    <ScanDialog
      open={scanOpen}
      onOpenChange={setScanOpen}
      title="Scan the product barcode"
      onScan={(code) => setValue("barcode", normalizeCode(code), { shouldDirty: true })}
    />

    <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>Create a category and select it for this product.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Name</label>
            <Input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="e.g. Electronics"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Color</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCategoryColor(color)}
                  className={`h-8 w-8 rounded-lg transition-transform ${
                    categoryColor === color ? "scale-110 ring-2 ring-white" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Use category color ${color}`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={() => setCategoryOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateCategory} disabled={addCategory.isPending}>
            {addCategory.isPending ? "Saving..." : "Save Category"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
