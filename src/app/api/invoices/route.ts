import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { computeInvoiceTotals, getNextInvoiceNumber } from "@/lib/invoices";
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

export async function GET() {
  const session = await getSession();
  if (!session?.userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const invoices = await prisma.invoice.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(invoices.map(mapInvoice));
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = invoicePayloadSchema.parse(await request.json());
    const now = new Date();
    const totals = computeInvoiceTotals(body.items, body.tax);

    const full = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: await getNextInvoiceNumber(tx, now),
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

      await tx.invoiceItem.createMany({
        data: body.items.map((item) => ({
          invoiceId: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      });

      return tx.invoice.findUnique({
        where: { id: invoice.id },
        include: { items: true },
      });
    });

    return Response.json(mapInvoice(full!));
  } catch (error) {
    console.error(error);
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid invoice payload", detail: error.issues[0]?.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: "Failed to create invoice", detail: message }, { status: 500 });
  }
}
