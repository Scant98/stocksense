import { formatCurrency } from "@/lib/utils";
import type { Sale } from "@/lib/types";

const METHOD_LABEL: Record<Sale["paymentMethod"], string> = {
  cash: "Cash",
  mobile_money: "Mobile money",
  card: "Card",
};

const SHOP_NAME = process.env.NEXT_PUBLIC_SHOP_NAME || "StockSense";

/** 80mm thermal-style receipt. Light colours on purpose: it is also what gets printed. */
export function Receipt({ sale }: { sale: Sale }) {
  const date = new Date(sale.createdAt);
  return (
    <div className="mx-auto w-[72mm] bg-white p-3 font-mono text-[11px] leading-snug text-black">
      <div className="text-center">
        <p className="text-sm font-bold uppercase">{SHOP_NAME}</p>
        <p>{date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
        <p>Receipt {sale.receiptNumber}</p>
        {sale.cashierName && <p>Served by {sale.cashierName}</p>}
      </div>

      <hr className="my-2 border-dashed border-black" />

      <div className="space-y-1.5">
        {sale.items.map((item) => (
          <div key={item.id}>
            <p className="font-semibold">{item.name}</p>
            <div className="flex justify-between">
              <span>
                {item.quantity} × {formatCurrency(item.unitPrice)}
              </span>
              <span>{formatCurrency(item.total)}</span>
            </div>
          </div>
        ))}
      </div>

      <hr className="my-2 border-dashed border-black" />

      <div className="space-y-0.5">
        <div className="flex justify-between text-sm font-bold">
          <span>TOTAL</span>
          <span>{formatCurrency(sale.total)}</span>
        </div>
        <div className="flex justify-between">
          <span>{METHOD_LABEL[sale.paymentMethod]}</span>
          <span>{formatCurrency(sale.amountPaid)}</span>
        </div>
        {sale.change > 0 && (
          <div className="flex justify-between">
            <span>Change</span>
            <span>{formatCurrency(sale.change)}</span>
          </div>
        )}
      </div>

      <hr className="my-2 border-dashed border-black" />
      <p className="text-center">Thank you for shopping with us!</p>
    </div>
  );
}
