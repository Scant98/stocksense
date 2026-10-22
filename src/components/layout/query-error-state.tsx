"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";

interface QueryErrorStateProps {
  title?: string;
  message: string;
}

export function QueryErrorState({
  title = "Could not load this section",
  message,
}: QueryErrorStateProps) {
  return (
    <>
    {/* Keep the menu button reachable even when the page failed to load. */}
    <Header title="StockSense" />
    <div className="flex h-full items-center justify-center p-6">
      <div className="glass max-w-md rounded-2xl p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <Button className="mt-5" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    </div>
    </>
  );
}
