import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { computeInvoiceTotals } from "@/lib/invoices";
import { invoicePayloadSchema } from "@/lib/validators";
import { ZodError } from "zod";

function mapInvoice(inv: {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  status: string;
  notes: string;
  subtotal: number;
  tax: number;
  total: number;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    invoiceId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}) {
  return {
    ...inv,
    dueDate: inv.dueDate?.toISOString() ?? null,
    createdAt: inv.createdAt.toISOString(),
    updatedAt: inv.updatedAt.toISOString(),
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: { items: true } });
  if (!invoice) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json(mapInvoice(invoice));
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const body = invoicePayloadSchema.parse(await request.json());
    const totals = computeInvoiceTotals(body.items, body.tax);

    const invoice = await prisma.$transaction(async (tx) => {
      const existing = await tx.invoice.findUnique({ where: { id } });
      if (!existing) return null;

      await tx.invoice.update({
        where: { id },
        data: {
          clientName: body.clientName,
          clientEmail: body.clientEmail ?? "",
          clientPhone: body.clientPhone ?? "",
          clientAddress: body.clientAddress ?? "",
          status: body.status,
          notes: body.notes ?? "",
          subtotal: totals.subtotal,
          tax: body.tax,
          total: totals.total,
          dueDate: body.dueDate ?? null,
        },
      });

      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await tx.invoiceItem.createMany({
        data: body.items.map((item) => ({
          invoiceId: id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      });

      return tx.invoice.findUnique({
        where: { id },
        include: { items: true },
      });
    });

    if (!invoice) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(mapInvoice(invoice!));
  } catch (error) {
    console.error(error);
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid invoice payload", detail: error.issues[0]?.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: "Failed to update invoice", detail: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await prisma.invoice.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
