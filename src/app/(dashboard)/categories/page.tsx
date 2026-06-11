"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Package } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCategories, useAddCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/use-api";
import { toast } from "sonner";

const COLORS = [
  "#64748B", "#10B981", "#F59E0B", "#F43F5E", "#D946EF", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#78716C", "#84CC16", "#EAB308",
];

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();
  const [open, setOpen] = useState(false);
  const [editCat, setEditCat] = useState<{id: string; name: string; color: string} | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const addCategory = useAddCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const handleOpen = (cat?: {id: string; name: string; color: string}) => {
    if (cat) {
      setEditCat(cat);
      setName(cat.name);
      setColor(cat.color);
    } else {
      setEditCat(null);
      setName("");
      setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }
    try {
      if (editCat) {
        await updateCategory.mutateAsync({ id: editCat.id, data: { name, color } });
        toast.success("Category updated");
      } else {
        await addCategory.mutateAsync({ name, color });
        toast.success("Category created");
      }
      setOpen(false);
    } catch {
      toast.error("Failed to save category");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? All products will need a new category.")) return;
    try {
      await deleteCategory.mutateAsync(id);
      toast.success("Category deleted");
    } catch {
      toast.error("Cannot delete - category has products");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Header
        title="Categories"
        subtitle="Manage product categories"
        action={
          <Button onClick={() => handleOpen()}>
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        }
      />

      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {categories.map((cat) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative rounded-xl border border-border bg-muted/40 p-4 transition-colors hover:bg-accent"
            >
              <div
                className="mb-3 h-10 w-10 rounded-lg"
                style={{ backgroundColor: cat.color }}
              />
              <p className="font-medium text-foreground">{cat.name}</p>
              <p className="text-xs text-muted-foreground">
                {cat.productsCount ?? 0} products
              </p>
              <div className="mt-3 flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleOpen(cat)} title="Edit category">
                  <Edit2 className="h-3 w-3" />
                  <span className="ml-1 text-xs">Edit</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)} title="Delete category" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No categories yet</p>
            <Button className="mt-3" onClick={() => handleOpen()}>
              <Plus className="h-4 w-4" />
              Add First Category
            </Button>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editCat ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>
              {editCat ? "Update category details" : "Create a new product category"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Electronics"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-8 w-8 rounded-lg transition-transform ${
                      color === c ? "scale-110 ring-2 ring-white" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}