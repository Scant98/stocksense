import type { Prisma } from "@prisma/client";

export function computeInvoiceTotals(
  items: { quantity: number; unitPrice: number }[],
  taxPercent: number
) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = subtotal + subtotal * (taxPercent / 100);
  return { subtotal, total };
}

/** Atomically bump a named counter and return the new value. */
async function nextSequenceValue(tx: Prisma.TransactionClient, key: string) {
  await tx.invoiceSequence.upsert({
    where: { key },
    create: { key, value: 0 },
    update: {},
  });

  const sequence = await tx.invoiceSequence.update({
    where: { key },
    data: { value: { increment: 1 } },
  });

  return sequence.value;
}

function monthKey(now: Date) {
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function getNextInvoiceNumber(
  tx: Prisma.TransactionClient,
  now: Date = new Date()
) {
  const key = monthKey(now);
  const value = await nextSequenceValue(tx, key);
  return `INV-${key}-${String(value).padStart(4, "0")}`;
}

export async function getNextReceiptNumber(
  tx: Prisma.TransactionClient,
  now: Date = new Date()
) {
  const key = monthKey(now);
  const value = await nextSequenceValue(tx, `RCT-${key}`);
  return `RCT-${key}-${String(value).padStart(5, "0")}`;
}
