import { z } from "zod";

export const productStatusSchema = z.enum(["in_stock", "low_stock", "warning", "out_of_stock"]);
export const invoiceStatusSchema = z.enum(["draft", "sent", "paid", "overdue"]);
export const transactionTypeSchema = z.enum(["purchase", "sale", "adjustment", "return"]);
export const wipeScopeSchema = z.enum(["all", "invoices", "transactions", "products", "suppliers", "categories"]);

const optionalTrimmedString = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().optional());

const optionalEmail = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.email().optional());

export const productPayloadSchema = z.object({
  name: z.string().trim().min(2, "Product name is required"),
  sku: optionalTrimmedString,
  categoryId: z.string().trim().min(1, "Category is required"),
  supplierId: optionalTrimmedString,
  quantity: z.coerce.number().int().min(0, "Quantity must be 0 or more"),
  reorderPoint: z.coerce.number().int().min(0, "Reorder point must be 0 or more"),
  unitPrice: z.coerce.number().min(0, "Unit price must be 0 or more"),
  sellingPrice: z.coerce.number().min(0, "Selling price must be 0 or more"),
  description: z.string().optional().default(""),
  location: z.string().optional().default(""),
  lastRestocked: z.preprocess((value) => {
    if (value === null || value === undefined || value === "") return undefined;
    if (value instanceof Date) return value;
    if (typeof value === "string" || typeof value === "number") return new Date(value);
    return value;
  }, z.date().optional()),
});

const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, "Item description is required"),
  quantity: z.coerce.number().int().min(1, "Item quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Item unit price must be 0 or more"),
});

export const invoicePayloadSchema = z.object({
  clientName: z.string().trim().min(1, "Client name is required"),
  clientEmail: optionalEmail,
  clientPhone: z.string().optional().default(""),
  clientAddress: z.string().optional().default(""),
  status: invoiceStatusSchema.default("draft"),
  notes: z.string().optional().default(""),
  dueDate: z.preprocess((value) => {
    if (value === null || value === undefined || value === "") return undefined;
    if (value instanceof Date) return value;
    if (typeof value === "string" || typeof value === "number") return new Date(value);
    return value;
  }, z.date().optional()),
  tax: z.coerce.number().min(0, "Tax must be at least 0").max(100, "Tax must be 100 or less").default(0),
  items: z.array(invoiceItemSchema).min(1, "At least one invoice item is required"),
});

export const transactionPayloadSchema = z.object({
  productId: z.string().trim().min(1, "Product is required"),
  type: transactionTypeSchema,
  quantity: z.coerce.number().int().positive("Quantity must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Unit price must be 0 or more"),
  reference: optionalTrimmedString,
  notes: z.string().optional().default(""),
});

export const wipePayloadSchema = z.object({
  scope: z.array(wipeScopeSchema).min(1).default(["all"]),
});
