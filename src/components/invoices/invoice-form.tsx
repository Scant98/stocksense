"use client";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Invoice } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const itemSchema = z.object({
  description: z.string().min(1, "Required"),
  quantity: z.number().min(1, "Min 1"),
  unitPrice: z.number().min(0, "Min 0"),
});

const schema = z.object({
  clientName: z.string().min(1, "Client name required"),
  clientEmail: z.string().optional(),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(["draft", "sent", "paid", "overdue"]),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, "Add at least one item"),
  tax: z.number().min(0).max(100),
});

type FormData = z.infer<typeof schema>;

interface InvoiceFormProps {
  invoice?: Invoice;
  onSubmit: (data: Partial<Invoice>) => void;
  onCancel: () => void;
}

export function InvoiceForm({ invoice, onSubmit, onCancel }: InvoiceFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: invoice
      ? {
          clientName: invoice.clientName,
          clientEmail: invoice.clientEmail,
          clientPhone: invoice.clientPhone,
          clientAddress: invoice.clientAddress,
          dueDate: invoice.dueDate?.slice(0, 10) ?? "",
          status: invoice.status,
          notes: invoice.notes,
          items: invoice.items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
          tax: invoice.tax,
        }
      : {
          status: "draft",
          items: [{ description: "", quantity: 1, unitPrice: 0 }],
          tax: 0,
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = useWatch({ control, name: "items" }) ?? [];
  const watchedTax = useWatch({ control, name: "tax" }) ?? 0;

  const subtotal = watchedItems.reduce(
    (sum, item) => sum + (item?.quantity ?? 0) * (item?.unitPrice ?? 0),
    0
  );
  const taxAmount = subtotal * (watchedTax / 100);
  const total = subtotal + taxAmount;

  const onFormSubmit = (data: FormData) => {
    const computedSubtotal = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const computedTaxAmount = computedSubtotal * (data.tax / 100);
    onSubmit({
      clientName: data.clientName,
      clientEmail: data.clientEmail ?? "",
      clientPhone: data.clientPhone ?? "",
      clientAddress: data.clientAddress ?? "",
      status: data.status,
      notes: data.notes ?? "",
      dueDate: data.dueDate || null,
      subtotal: computedSubtotal,
      tax: data.tax,
      total: computedSubtotal + computedTaxAmount,
      items: data.items.map((item) => ({
        id: "",
        invoiceId: "",
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
      {/* Client Info */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
          Client Information
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Client Name *
            </label>
            <Input {...register("clientName")} placeholder="e.g. Juma Enterprises" />
            {errors.clientName && (
              <p className="mt-1 text-xs text-destructive">{errors.clientName.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
            <Input {...register("clientEmail")} placeholder="client@example.com" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Phone</label>
            <Input {...register("clientPhone")} placeholder="+255 712 000 000" />
          </div>
          <div className="col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Address</label>
            <Input {...register("clientAddress")} placeholder="Dar es Salaam, Tanzania" />
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
          Invoice Details
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Status</label>
            <Select
              defaultValue={invoice?.status ?? "draft"}
              onValueChange={(v) => setValue("status", v as FormData["status"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Due Date</label>
            <Input type="date" {...register("dueDate")} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tax (%)</label>
            <Input
              type="number"
              step="0.1"
              {...register("tax", { valueAsNumber: true })}
              placeholder="18"
            />
          </div>
          <div className="col-span-3">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Notes</label>
            <Input {...register("notes")} placeholder="Payment terms, bank details, etc." />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Line Items
          </p>
          <button
            type="button"
            onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-primary hover:bg-primary/10 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Item
          </button>
        </div>

        {errors.items && typeof errors.items.message === "string" && (
          <p className="mb-2 text-xs text-destructive">{errors.items.message}</p>
        )}

        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-1">
            <p className="col-span-6 text-xs text-muted-foreground">Description</p>
            <p className="col-span-2 text-xs text-muted-foreground">Qty</p>
            <p className="col-span-3 text-xs text-muted-foreground">Unit Price</p>
            <p className="col-span-1" />
          </div>

          {fields.map((field, index) => {
            const qty = watchedItems[index]?.quantity ?? 0;
            const price = watchedItems[index]?.unitPrice ?? 0;
            const lineTotal = qty * price;
            return (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6">
                  <Input
                    {...register(`items.${index}.description`)}
                    placeholder="Product or service description"
                  />
                  {errors.items?.[index]?.description && (
                    <p className="mt-0.5 text-xs text-destructive">
                      {errors.items[index]?.description?.message}
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min={1}
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                    placeholder="50000"
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {lineTotal > 0 && (
                  <p className="col-span-12 -mt-1 pl-1 text-xs text-muted-foreground">
                    = {formatCurrency(lineTotal)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Totals */}
      <div className="rounded-xl bg-muted/40 p-4 space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Tax ({watchedTax}%)</span>
          <span>{formatCurrency(taxAmount)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{invoice ? "Update Invoice" : "Create Invoice"}</Button>
      </div>
    </form>
  );
}
