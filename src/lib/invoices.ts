import type { Prisma } from "@prisma/client";

export function computeInvoiceTotals(
  items: { quantity: number; unitPrice: number }[],
  taxPercent: number
) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = subtotal + subtotal * (taxPercent / 100);
  return { subtotal, total };
}

export async function getNextInvoiceNumber(
  tx: Prisma.TransactionClient,
  now: Date = new Date()
) {
  const key = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

  await tx.invoiceSequence.upsert({
    where: { key },
    create: { key, value: 0 },
    update: {},
  });

  const sequence = await tx.invoiceSequence.update({
    where: { key },
    data: { value: { increment: 1 } },
  });

  return `INV-${key}-${String(sequence.value).padStart(4, "0")}`;
}
