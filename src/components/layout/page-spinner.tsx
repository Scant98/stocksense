"use client";

import { Header } from "@/components/layout/header";

/** Full-page loading state that keeps the header (and the mobile menu button) visible. */
export function PageSpinner({ title = "Loading…" }: { title?: string }) {
  return (
    <>
      <Header title={title} />
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    </>
  );
}
