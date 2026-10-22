"use client";
import { motion } from "framer-motion";
import { AlertTriangle, XCircle, Clock } from "lucide-react";
import { PageSpinner } from "@/components/layout/page-spinner";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/magic/blur-fade";
import { formatDate } from "@/lib/utils";
import { useProducts } from "@/hooks/use-api";

export default function AlertsPage() {
  const { data: products = [], isLoading } = useProducts();

  const outOfStock = products.filter((p) => p.status === "out_of_stock");
  const lowStock = products.filter((p) => p.status === "low_stock");

  if (isLoading) {
    return (
      <PageSpinner />
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
      <Header title="Alerts" subtitle="Items requiring immediate attention" />

      <div className="p-6 space-y-6">
        {/* Out of Stock */}
        <BlurFade delay={0.1}>
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <XCircle className="h-5 w-5 text-destructive" />
              <h3 className="font-semibold text-foreground">Out of Stock</h3>
              <Badge variant="danger">{outOfStock.length}</Badge>
            </div>
            <div className="divide-y divide-white/5">
              {outOfStock.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">No items out of stock</p>
              ) : (
                outOfStock.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.06 }}
                    className="flex items-center justify-between px-5 py-4"
                  >
                    <div>
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Reorder point</p>
                        <p className="font-semibold text-destructive">{p.reorderPoint} units</p>
                      </div>
                      <Button size="sm" variant="destructive">Order Now</Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </BlurFade>

        {/* Low Stock */}
        <BlurFade delay={0.2}>
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <AlertTriangle className="h-5 w-5 text-warning" />
              </motion.div>
              <h3 className="font-semibold text-foreground">Low Stock Warning</h3>
              <Badge variant="warning">{lowStock.length}</Badge>
            </div>
            <div className="divide-y divide-white/5">
              {lowStock.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">No low stock alerts</p>
              ) : (
                lowStock.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.06 }}
                    className="flex items-center justify-between px-5 py-4"
                  >
                    <div>
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category.name}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Current / Min</p>
                        <p className="font-semibold text-warning">
                          {p.quantity} / {p.reorderPoint}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Last restocked</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(p.lastRestocked)}
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Reorder</Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </BlurFade>
      </div>
    </motion.div>
  );
}
