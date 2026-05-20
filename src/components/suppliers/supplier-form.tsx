"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Supplier } from "@/lib/types";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  rating: z.number().min(0).max(5),
  status: z.enum(["active", "inactive"]),
});

type FormData = z.infer<typeof schema>;

interface SupplierFormProps {
  supplier?: Supplier;
  onSubmit: (data: Partial<Supplier>) => void;
  onCancel: () => void;
}

export function SupplierForm({ supplier, onSubmit, onCancel }: SupplierFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: supplier
      ? {
          name: supplier.name,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address,
          country: supplier.country,
          rating: supplier.rating,
          status: supplier.status,
        }
      : { country: "Tanzania", rating: 0, status: "active" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-[#9CA3AF]">Company Name</label>
          <Input {...register("name")} placeholder="e.g. TechParts Ltd" />
          {errors.name && <p className="mt-1 text-xs text-[#F43F5E]">{errors.name.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#9CA3AF]">Email</label>
          <Input {...register("email")} type="email" placeholder="contact@supplier.com" />
          {errors.email && <p className="mt-1 text-xs text-[#F43F5E]">{errors.email.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#9CA3AF]">Phone</label>
          <Input {...register("phone")} placeholder="+255 22 000 0000" />
        </div>
        <div className="col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-[#9CA3AF]">Address</label>
          <Input {...register("address")} placeholder="123 Main St, Dar es Salaam" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#9CA3AF]">Country</label>
          <Input {...register("country")} placeholder="Tanzania" />
          {errors.country && <p className="mt-1 text-xs text-[#F43F5E]">{errors.country.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#9CA3AF]">Rating (0–5)</label>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="5"
            {...register("rating", { valueAsNumber: true })}
            placeholder="4.5"
          />
          {errors.rating && <p className="mt-1 text-xs text-[#F43F5E]">{errors.rating.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#9CA3AF]">Status</label>
          <Select
            defaultValue={supplier?.status ?? "active"}
            onValueChange={(v) => setValue("status", v as "active" | "inactive")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{supplier ? "Update Supplier" : "Add Supplier"}</Button>
      </div>
    </form>
  );
}
