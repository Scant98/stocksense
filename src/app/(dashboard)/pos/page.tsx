"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  Camera,
  CameraOff,
  CreditCard,
  History,
  Minus,
  PackageX,
  Plus,
  Printer,
  ScanBarcode,
  Search,
  Smartphone,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CameraScanner } from "@/components/scanner/camera-scanner";
import { Receipt } from "@/components/pos/receipt";
import { useHardwareScanner } from "@/hooks/use-hardware-scanner";
import { lookupProduct, useCategories, useCreateSale, useProducts, useSales } from "@/hooks/use-api";
import { codeVariants } from "@/lib/barcode";
import { scanFeedback } from "@/lib/scan-feedback";
import { cn, formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/stores/cart";
import type { PaymentMethod, Product, Sale } from "@/lib/types";

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "mobile_money", label: "Mobile money", icon: Smartphone },
  { value: "card", label: "Card", icon: CreditCard },
];

const QUICK_TENDER = [5000, 10000, 20000, 50000];
const TILE_LIMIT = 60;

function matchesCode(product: Product, variants: string[]) {
  return variants.some((v) => product.barcode === v || product.sku === v || product.id === v);
}

export default function PosPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const createSale = useCreateSale();

  const lines = useCartStore((s) => s.lines);
  const cart = useCartStore.getState;

  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [cameraOn, setCameraOn] = useState(false);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [tendered, setTendered] = useState("");
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const flashTimer = useRef<number | undefined>(undefined);

  // Restore the persisted basket on the client only, and make sure stock levels are fresh.
  useEffect(() => {
    void qc.invalidateQueries({ queryKey: ["products"] });
    void Promise.resolve(useCartStore.persist.rehydrate()).then(() => setReady(true));
  }, [qc]);

  const productsRef = useRef(products);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const cartLines = useMemo(
    () =>
      lines.flatMap((line) => {
        const product = byId.get(line.productId);
        if (!product) return [];
        const unitPrice = line.unitPrice ?? product.sellingPrice;
        return [{ ...line, product, unitPrice, total: unitPrice * line.quantity }];
      }),
    [lines, byId]
  );

  const total = cartLines.reduce((sum, l) => sum + l.total, 0);
  const itemCount = cartLines.reduce((sum, l) => sum + l.quantity, 0);
  const tenderedAmount = tendered === "" ? total : Number(tendered);
  const change = method === "cash" ? Math.max(0, tenderedAmount - total) : 0;
  const shortBy = method === "cash" ? Math.max(0, total - tenderedAmount) : 0;

  const refocus = () => {
    // Don't pop the on-screen keyboard on phones/tablets; desktop tills keep focus for the scanner gun.
    if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
  };

  const addProduct = useCallback((product: Product) => {
    const inCart = cart().lines.find((l) => l.productId === product.id)?.quantity ?? 0;
    if (product.quantity <= 0) {
      scanFeedback("error");
      toast.error(`${product.name} is out of stock`);
      return false;
    }
    if (inCart + 1 > product.quantity) {
      scanFeedback("error");
      toast.error(`Only ${product.quantity} of ${product.name} in stock`);
      return false;
    }
    cart().add(product.id);
    scanFeedback("ok");
    setLastAdded(`${product.name} · ${formatCurrency(product.sellingPrice)}`);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setLastAdded(null), 2500);
    return true;
  }, [cart]);

  const handleCode = useCallback(
    async (raw: string) => {
      const variants = codeVariants(raw);
      if (variants.length === 0) return;

      let product = productsRef.current.find((p) => matchesCode(p, variants));
      if (!product) {
        // Not in the cached list (added on another device?): ask the server before giving up.
        try {
          const found = await lookupProduct(raw);
          if (found) {
            product = found;
            void qc.invalidateQueries({ queryKey: ["products"] });
          }
        } catch {
          // fall through to the "unknown code" path
        }
      }

      if (!product) {
        scanFeedback("error");
        toast.error(`No product with code ${variants[0]}`, {
          action: {
            label: "Add product",
            onClick: () => router.push(`/inventory?barcode=${encodeURIComponent(variants[0])}`),
          },
        });
        return;
      }
      addProduct(product);
    },
    [addProduct, qc, router]
  );

  useHardwareScanner(handleCode, !receipt && !historyOpen);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryId !== "all" && p.categoryId !== categoryId) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
      );
    });
  }, [products, query, categoryId]);

  const onScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const variants = codeVariants(q);
    const exact = products.find((p) => matchesCode(p, variants));
    if (exact) {
      addProduct(exact);
    } else if (/^[\w-]{6,}$/.test(q) && !results.length) {
      void handleCode(q); // looks like a code that we don't know locally
    } else if (results.length > 0) {
      addProduct(results[0]); // typed a name: Enter picks the best match
    } else {
      scanFeedback("error");
      toast.error(`Nothing matches "${q}"`);
    }
    setQuery("");
    refocus();
  };

  const checkout = async () => {
    if (cartLines.length === 0) return;
    if (shortBy > 0) {
      toast.error(`Amount received is short by ${formatCurrency(shortBy)}`);
      return;
    }
    try {
      const sale = await createSale.mutateAsync({
        items: cartLines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice === l.product.sellingPrice ? undefined : l.unitPrice,
        })),
        paymentMethod: method,
        amountPaid: method === "cash" ? tenderedAmount : undefined,
      });
      cart().clear();
      setTendered("");
      setReceipt(sale);
      scanFeedback("ok");
    } catch (error) {
      scanFeedback("error");
      toast.error(error instanceof Error ? error.message : "Checkout failed");
    }
  };

  const closeReceipt = () => {
    setReceipt(null);
    refocus();
  };

  return (
    <>
      <Header
        title="Point of Sale"
        subtitle="Scan items to build the basket"
        action={
          <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
            <History className="size-4" />
            <span className="hidden sm:inline">Receipts</span>
          </Button>
        }
      />

      <div className="grid gap-4 p-4 pb-24 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] lg:p-6 lg:pb-6">
        {/* Scan + product picker */}
        <div className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
            <form onSubmit={onScanSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <ScanBarcode className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-primary" />
                <Input
                  ref={inputRef}
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Scan barcode or search by name…"
                  aria-label="Scan barcode or search by name"
                  autoComplete="off"
                  inputMode="search"
                  className="h-11 pl-10 text-base"
                />
              </div>
              <Button
                type="button"
                variant={cameraOn ? "secondary" : "default"}
                className="h-11 px-4"
                onClick={() => setCameraOn((v) => !v)}
              >
                {cameraOn ? <CameraOff className="size-4" /> : <Camera className="size-4" />}
                <span className="hidden 2xl:inline">{cameraOn ? "Close camera" : "Scan with camera"}</span><span className="sr-only 2xl:hidden">Camera</span>
              </Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
              Works with USB/Bluetooth scanners (just scan), or use the camera on a phone or tablet.
            </p>

            {cameraOn && (
              <div className="mt-3 space-y-2">
                <CameraScanner onScan={handleCode} className="mx-auto max-w-xl" />
                <p
                  className={cn(
                    "text-center text-sm font-medium transition-opacity",
                    lastAdded ? "text-success opacity-100" : "opacity-0"
                  )}
                  aria-live="polite"
                >
                  ✓ Added {lastAdded}
                </p>
              </div>
            )}
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[{ id: "all", name: "All" }, ...categories].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  categoryId === c.id
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Product tiles */}
          {isLoading ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-3">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/50" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              <Search className="mx-auto mb-2 size-6 opacity-40" />
              No products match.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-3">
                {results.slice(0, TILE_LIMIT).map((p) => {
                  const out = p.quantity <= 0;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={out}
                      onClick={() => {
                        addProduct(p);
                        refocus();
                      }}
                      className="flex min-h-24 flex-col justify-between rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="line-clamp-2 text-sm font-medium leading-snug">{p.name}</span>
                      <span className="mt-2 flex flex-wrap items-end justify-between gap-x-2">
                        <span className="text-sm font-semibold text-primary">{formatCurrency(p.sellingPrice)}</span>
                        {out ? (
                          <Badge variant="danger">Out</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">{p.quantity} left</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
              {results.length > TILE_LIMIT && (
                <p className="text-center text-xs text-muted-foreground">
                  Showing {TILE_LIMIT} of {results.length}. Search or scan to find the rest.
                </p>
              )}
            </>
          )}
        </div>

        {/* Cart */}
        <aside id="cart" className="lg:sticky lg:top-20 lg:self-start">
          <div className="flex max-h-[calc(100vh-7rem)] flex-col rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">
                Current sale {ready && itemCount > 0 && <span className="text-muted-foreground">· {itemCount} {itemCount === 1 ? "item" : "items"}</span>}
              </h2>
              {cartLines.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => cart().clear()} className="text-muted-foreground">
                  <Trash2 className="size-3.5" /> Clear
                </Button>
              )}
            </div>

            <div className="min-h-32 flex-1 overflow-y-auto">
              {!ready || cartLines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-10 text-center text-sm text-muted-foreground">
                  <ScanBarcode className="size-8 opacity-40" />
                  Scan a product to start the sale.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {cartLines.map((l) => (
                    <li key={l.productId} className="space-y-2 px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">{l.product.name}</p>
                        <button
                          type="button"
                          onClick={() => cart().remove(l.productId)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label={`Remove ${l.product.name}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => cart().setQuantity(l.productId, l.quantity - 1)}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="size-3.5" />
                          </Button>
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={l.product.quantity}
                            value={l.quantity}
                            onChange={(e) => {
                              const n = Math.floor(Number(e.target.value));
                              if (!Number.isFinite(n)) return;
                              cart().setQuantity(l.productId, Math.min(n, l.product.quantity));
                            }}
                            className="h-8 w-14 text-center"
                            aria-label="Quantity"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            disabled={l.quantity >= l.product.quantity}
                            onClick={() => cart().setQuantity(l.productId, l.quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            <Plus className="size-3.5" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            value={l.unitPrice}
                            onChange={(e) => {
                              const n = Number(e.target.value);
                              if (!Number.isFinite(n) || n < 0) return;
                              cart().setPrice(l.productId, n === l.product.sellingPrice ? undefined : n);
                            }}
                            className={cn("h-7 w-24 text-right text-xs", l.unitPrice !== l.product.sellingPrice && "border-warning")}
                            aria-label="Unit price"
                          />
                          <p className="mt-1 text-sm font-semibold">{formatCurrency(l.total)}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-3 border-t border-border p-4">
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMethod(value)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-xs font-medium transition-colors",
                      method === value
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </button>
                ))}
              </div>

              {method === "cash" && cartLines.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      placeholder={`Received (${formatCurrency(total)})`}
                      value={tendered}
                      onChange={(e) => setTendered(e.target.value)}
                      className="h-9"
                      aria-label="Cash received"
                    />
                    <Button variant="outline" size="sm" onClick={() => setTendered("")}>
                      Exact
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_TENDER.filter((n) => n >= total).slice(0, 3).map((n) => (
                      <Button key={n} variant="secondary" size="sm" onClick={() => setTendered(String(n))}>
                        {formatCurrency(n)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-2xl font-bold tabular-nums">{ready ? formatCurrency(total) : "—"}</span>
                </div>
                {method === "cash" && cartLines.length > 0 && (
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-muted-foreground">{shortBy > 0 ? "Short by" : "Change"}</span>
                    <span className={cn("font-semibold tabular-nums", shortBy > 0 ? "text-destructive" : "text-success")}>
                      {formatCurrency(shortBy > 0 ? shortBy : change)}
                    </span>
                  </div>
                )}
              </div>

              <Button
                className="h-12 w-full text-base"
                disabled={cartLines.length === 0 || shortBy > 0 || createSale.isPending}
                onClick={checkout}
              >
                {createSale.isPending ? "Processing…" : `Charge ${formatCurrency(total)}`}
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile total bar */}
      {ready && cartLines.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
          <div>
            <p className="text-xs text-muted-foreground">{itemCount} {itemCount === 1 ? "item" : "items"}</p>
            <p className="text-lg font-bold">{formatCurrency(total)}</p>
          </div>
          <Button onClick={() => document.getElementById("cart")?.scrollIntoView({ behavior: "smooth" })}>
            Review &amp; charge
          </Button>
        </div>
      )}

      {/* Receipt */}
      <Dialog open={!!receipt} onOpenChange={(open) => !open && closeReceipt()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sale complete</DialogTitle>
            <DialogDescription>Receipt {receipt?.receiptNumber}</DialogDescription>
          </DialogHeader>
          {receipt && (
            <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-border bg-white">
              <Receipt sale={receipt} />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="size-4" /> Print
            </Button>
            <Button onClick={closeReceipt}>New sale</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* History */}
      <ReceiptHistory open={historyOpen} onOpenChange={setHistoryOpen} onSelect={(s) => { setHistoryOpen(false); setReceipt(s); }} />

      <div id="print-area" className="hidden print:block">
        {receipt && <Receipt sale={receipt} />}
      </div>

      {!isLoading && products.length === 0 && (
        <div className="mx-4 flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm lg:mx-6">
          <PackageX className="size-5 text-warning" />
          No products yet. Add products in Inventory (each one gets a scannable barcode automatically).
        </div>
      )}
    </>
  );
}

function ReceiptHistory({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (sale: Sale) => void;
}) {
  const { data: sales = [], isLoading } = useSales(open);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Recent receipts</SheetTitle>
          <SheetDescription>Tap a receipt to view or reprint it.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : sales.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No sales yet.</p>
          ) : (
            <ul className="space-y-2">
              {sales.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(s)}
                    className="flex w-full items-center justify-between rounded-xl border border-border p-3 text-left hover:bg-muted/40"
                  >
                    <div>
                      <p className="text-sm font-medium">{s.receiptNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} ·{" "}
                        {s.items.reduce((n, i) => n + i.quantity, 0)} items
                      </p>
                    </div>
                    <span className="text-sm font-semibold">{formatCurrency(s.total)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
