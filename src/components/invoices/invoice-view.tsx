"use client";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Invoice, InvoiceStatus } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  draft: "bg-muted/60 text-muted-foreground border-border",
  sent: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  paid: "bg-success/20 text-success border-success/30",
  overdue: "bg-destructive/20 text-destructive border-destructive/30",
};

function printInvoice(inv: Invoice) {
  const taxAmount = inv.subtotal * (inv.tax / 100);
  const itemRows = inv.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;">${item.description}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(item.unitPrice)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:500;">${formatCurrency(item.total)}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${inv.invoiceNumber}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:system-ui,-apple-system,sans-serif;color:#111827;padding:48px;font-size:14px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:48px}
    .brand{font-size:22px;font-weight:700;color:#059669;letter-spacing:-0.5px}
    .brand-sub{font-size:12px;color:#9CA3AF;margin-top:2px}
    .inv-meta{text-align:right}
    .inv-num{font-size:20px;font-weight:700;color:#111827}
    .inv-date{font-size:12px;color:#6B7280;margin-top:4px}
    .status{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-top:6px}
    .status-draft{background:#f3f4f6;color:#6B7280}
    .status-sent{background:#f5f3ff;color:#7C3AED}
    .status-paid{background:#ecfdf5;color:#10B981}
    .status-overdue{background:#fff1f2;color:#F43F5E}
    .section{margin-bottom:32px}
    .section-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#9CA3AF;margin-bottom:8px}
    .client-name{font-size:16px;font-weight:600;color:#111827}
    .client-info{font-size:13px;color:#6B7280;margin-top:3px;line-height:1.5}
    table{width:100%;border-collapse:collapse;margin-bottom:24px}
    thead tr{background:#f9fafb;border-bottom:2px solid #e5e7eb}
    thead th{padding:10px 8px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#6B7280}
    .totals{margin-left:auto;width:260px}
    .totals-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#6B7280}
    .totals-total{display:flex;justify-content:space-between;padding:12px 0 0;font-size:16px;font-weight:700;color:#111827;border-top:2px solid #111827;margin-top:4px}
    .notes{margin-top:32px;padding:16px;background:#f9fafb;border-radius:8px}
    .notes-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#9CA3AF;margin-bottom:6px}
    .notes-text{font-size:13px;color:#374151}
    .footer{margin-top:48px;text-align:center;font-size:11px;color:#9CA3AF}
    @media print{body{padding:24px}}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">StockSense</div>
      <div class="brand-sub">Inventory Management · Dar es Salaam</div>
    </div>
    <div class="inv-meta">
      <div class="inv-num">${inv.invoiceNumber}</div>
      <div class="inv-date">Issued: ${formatDate(inv.createdAt)}</div>
      ${inv.dueDate ? `<div class="inv-date">Due: ${formatDate(inv.dueDate)}</div>` : ""}
      <span class="status status-${inv.status}">${inv.status}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-label">Bill To</div>
    <div class="client-name">${inv.clientName}</div>
    <div class="client-info">
      ${inv.clientEmail ? `${inv.clientEmail}<br>` : ""}
      ${inv.clientPhone ? `${inv.clientPhone}<br>` : ""}
      ${inv.clientAddress ? inv.clientAddress : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align:left">Description</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals">
    <div class="totals-row"><span>Subtotal</span><span>${formatCurrency(inv.subtotal)}</span></div>
    ${inv.tax > 0 ? `<div class="totals-row"><span>Tax (${inv.tax}%)</span><span>${formatCurrency(taxAmount)}</span></div>` : ""}
    <div class="totals-total"><span>Total</span><span>${formatCurrency(inv.total)}</span></div>
  </div>

  ${inv.notes ? `<div class="notes"><div class="notes-label">Notes</div><div class="notes-text">${inv.notes}</div></div>` : ""}

  <div class="footer">Thank you for your business · StockSense</div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 300);
  }
}

interface InvoiceViewProps {
  invoice: Invoice;
}

export function InvoiceView({ invoice }: InvoiceViewProps) {
  const taxAmount = invoice.subtotal * (invoice.tax / 100);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-lg font-bold text-primary">{invoice.invoiceNumber}</p>
          <p className="text-xs text-muted-foreground">Issued {formatDate(invoice.createdAt)}</p>
          {invoice.dueDate && (
            <p className="text-xs text-muted-foreground">Due {formatDate(invoice.dueDate)}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[invoice.status]}`}
          >
            {invoice.status}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => printInvoice(invoice)}
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
        </div>
      </div>

      {/* Client */}
      <div className="rounded-xl bg-muted/40 px-4 py-3">
        <p className="mb-1 text-xs font-medium text-muted-foreground">Bill To</p>
        <p className="font-medium text-foreground">{invoice.clientName}</p>
        {invoice.clientEmail && <p className="text-sm text-muted-foreground">{invoice.clientEmail}</p>}
        {invoice.clientPhone && <p className="text-sm text-muted-foreground">{invoice.clientPhone}</p>}
        {invoice.clientAddress && <p className="text-sm text-muted-foreground">{invoice.clientAddress}</p>}
      </div>

      {/* Items */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Line Items</p>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-2 text-left text-xs text-muted-foreground">Description</th>
                <th className="px-3 py-2 text-center text-xs text-muted-foreground">Qty</th>
                <th className="px-3 py-2 text-right text-xs text-muted-foreground">Unit Price</th>
                <th className="px-3 py-2 text-right text-xs text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-b border-border/50 last:border-0">
                  <td className="px-3 py-2.5 text-foreground">{item.description}</td>
                  <td className="px-3 py-2.5 text-center text-muted-foreground">{item.quantity}</td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-foreground">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="ml-auto w-64 space-y-1.5 rounded-xl bg-muted/40 p-4">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatCurrency(invoice.subtotal)}</span>
        </div>
        {invoice.tax > 0 && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Tax ({invoice.tax}%)</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-border pt-2 font-semibold text-foreground">
          <span>Total</span>
          <span>{formatCurrency(invoice.total)}</span>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="rounded-xl bg-muted/40 px-4 py-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Notes</p>
          <p className="text-sm text-foreground">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}
