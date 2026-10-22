"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, Search } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CodeGraphic } from "@/components/labels/code-graphic";
import { useProducts } from "@/hooks/use-api";
import { cn, formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types";

type Kind = "barcode" | "qr";

const SIZES = {
  small: { label: "Small · 40×25 mm", box: "w-[40mm] h-[25mm]", name: "text-[7px]", price: "text-[8px]", code: "text-[6px]" },
  medium: { label: "Medium · 50×30 mm", box: "w-[50mm] h-[30mm]", name: "text-[8px]", price: "text-[10px]", code: "text-[7px]" },
  large: { label: "Large · 70×40 mm", box: "w-[70mm] h-[40mm]", name: "text-[11px]", price: "text-[14px]", code: "text-[9px]" },
} as const;
type SizeKey = keyof typeof SIZES;

/** The value printed into a label: the barcode, falling back to SKU, then the product id. */
const codeOf = (p: Product) => p.barcode || p.sku || p.id;

function LabelsContent() {
  const { data: products = [], isLoading } = useProducts();
  const params = useSearchParams();
  // Selection starts from ?ids=a,b (inventory row action) until the user edits it.
  const initial = useMemo(() => {
    const ids = params.get("ids")?.split(",").filter(Boolean) ?? [];
    return Object.fromEntries(ids.filter((id) => products.some((p) => p.id === id)).map((id) => [id, 1]));
  }, [params, products]);
  const [edited, setEdited] = useState<Record<string, number> | null>(null);
  const copies = edited ?? initial;
  const setCopies = (update: Record<string, number> | ((c: Record<string, number>) => Record<string, number>)) =>
    setEdited((prev) => (typeof update === "function" ? update(prev ?? initial) : update));
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<Kind>("barcode");
  const [size, setSize] = useState<SizeKey>("medium");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.barcode?.includes(q) || p.sku?.toLowerCase().includes(q)
    );
  }, [products, query]);

  const selected = useMemo(
    () => products.filter((p) => (copies[p.id] ?? 0) > 0),
    [products, copies]
  );
  const labels = useMemo(
    () => selected.flatMap((p) => Array.from({ length: Math.min(copies[p.id], 100) }, (_, i) => ({ p, key: `${p.id}-${i}` }))),
    [selected, copies]
  );

  const toggle = (id: string) =>
    setCopies((c) => {
      const next = { ...c };
      if (next[id]) delete next[id];
      else next[id] = 1;
      return next;
    });

  const s = SIZES[size];

  return (
    <>
      <Header
        title="Barcode Labels"
        subtitle={`${labels.length} label${labels.length === 1 ? "" : "s"} ready to print`}
        action={
          <Button onClick={() => window.print()} disabled={labels.length === 0}>
            <Printer className="size-4" /> Print
          </Button>
        }
      />

      <div className="grid gap-4 p-4 lg:grid-cols-[360px_minmax(0,1fr)] lg:p-6">
        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <div className="grid grid-cols-2 gap-2">
              {(["barcode", "qr"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                    kind === k ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  )}
                >
                  {k === "barcode" ? "Barcode" : "QR code"}
                </button>
              ))}
            </div>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as SizeKey)}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
              aria-label="Label size"
            >
              {Object.entries(SIZES).map(([key, v]) => (
                <option key={key} value={key}>
                  {v.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Set your printer to the label size, scale 100%, and turn off headers/footers.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card">
            <div className="space-y-2 border-b border-border p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" className="pl-9" />
              </div>
              <div className="flex gap-2 text-xs">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCopies(Object.fromEntries(filtered.map((p) => [p.id, copies[p.id] || 1])))}
                >
                  Select shown
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setCopies({})}>
                  Clear
                </Button>
              </div>
            </div>
            <ul className="max-h-[50vh] divide-y divide-border overflow-y-auto">
              {isLoading && <li className="p-4 text-sm text-muted-foreground">Loading…</li>}
              {filtered.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={!!copies[p.id]}
                    onChange={() => toggle(p.id)}
                    className="size-4 accent-[var(--primary)]"
                    aria-label={`Select ${p.name}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">{codeOf(p)}</p>
                  </div>
                  {copies[p.id] ? (
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={copies[p.id]}
                      onChange={(e) => setCopies((c) => ({ ...c, [p.id]: Math.max(1, Math.min(100, Number(e.target.value) || 1)) }))}
                      className="h-8 w-16 text-center"
                      aria-label={`Copies of ${p.name}`}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-border bg-muted/30 p-4">
          {labels.length === 0 ? (
            <p className="py-20 text-center text-sm text-muted-foreground">
              Select products on the left to preview their labels.
            </p>
          ) : (
            <div id="print-area" className="flex flex-wrap gap-2 print:gap-0">
              {labels.map(({ p, key }) => (
                <div
                  key={key}
                  className={cn(
                    "flex break-inside-avoid flex-col justify-between overflow-hidden rounded-sm border border-dashed border-neutral-300 bg-white p-[1.5mm] text-black print:rounded-none print:border-neutral-200",
                    s.box
                  )}
                >
                  <div className="flex items-start justify-between gap-1 leading-tight">
                    <span className={cn("line-clamp-2 font-semibold", s.name)}>{p.name}</span>
                    <span className={cn("shrink-0 font-bold", s.price)}>{formatCurrency(p.sellingPrice)}</span>
                  </div>
                  <CodeGraphic
                    value={codeOf(p)}
                    kind={kind}
                    className={cn("min-h-0 flex-1 py-[0.6mm]", kind === "qr" && "flex items-center justify-center [&>svg]:h-full [&>svg]:w-auto")}
                  />
                  <p className={cn("text-center font-mono leading-none", s.code)}>{codeOf(p)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function LabelsPage() {
  return (
    <Suspense fallback={null}>
      <LabelsContent />
    </Suspense>
  );
}
