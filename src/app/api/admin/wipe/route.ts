import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { wipePayloadSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden — admins only" }, { status: 403 });
  }

  try {
    const body = wipePayloadSchema.parse(await req.json().catch(() => ({})));
    const wipeAll = body.scope.includes("all");
    const scope = wipeAll
      ? ["invoices", "transactions", "products", "suppliers", "categories"]
      : body.scope;

    await prisma.$transaction(async (tx) => {
      if (scope.includes("categories") && !scope.includes("products")) {
        const linkedProducts = await tx.product.count();
        if (linkedProducts > 0) {
          throw new Error("Cannot wipe categories while products still exist. Include products in the wipe or remove them first.");
        }
      }

      if (scope.includes("invoices")) {
        await tx.invoiceItem.deleteMany();
        await tx.invoice.deleteMany();
      }
      if (scope.includes("transactions")) {
        await tx.sale.deleteMany();
        await tx.transaction.deleteMany();
      }
      if (scope.includes("products")) {
        await tx.product.deleteMany();
      }
      if (scope.includes("suppliers")) {
        await tx.supplier.deleteMany();
      }
      if (scope.includes("categories")) {
        await tx.category.deleteMany();
      }
    });

    return NextResponse.json({ success: true, scope: wipeAll ? "all" : scope });
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid wipe payload", detail: e.issues[0]?.message },
        { status: 400 }
      );
    }

    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Wipe failed", detail },
      { status: detail.includes("Cannot wipe categories") ? 400 : 500 }
    );
  }
}
