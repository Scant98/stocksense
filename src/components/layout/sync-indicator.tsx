"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, CloudOff, RefreshCw, Check } from "lucide-react";
import { toast } from "sonner";
import { useOnline } from "@/hooks/use-online";
import { useQueryClient } from "@tanstack/react-query";

interface SyncState {
  enabled: boolean;
  mode: "embedded-replica" | "remote" | "disabled";
  lastSync: string | null;
  lastError: string | null;
  message: string | null;
  syncCount: number;
}

export function SyncIndicator() {
  const online = useOnline();
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [state, setState] = useState<SyncState | null>(null);

  const refreshState = async () => {
    try {
      const res = await fetch("/api/sync", { cache: "no-store" });
      if (res.ok) setState(await res.json());
    } catch {}
  };

  useEffect(() => {
    const initial = window.setTimeout(() => {
      refreshState();
    }, 0);
    const id = window.setInterval(() => {
      if (navigator.onLine && document.visibilityState === "visible") refreshState();
    }, 60_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(id);
    };
  }, []);

  const runSync = async () => {
    if (!online) {
      toast.error("Offline — changes will sync when back online");
      return;
    }
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const body: SyncState & { error?: string; detail?: string } = await res.json();
      if (!res.ok) throw new Error(body.detail ?? body.error ?? "Sync failed");
      setState(body);
      qc.refetchQueries({ type: "active" });
      toast.success(
        body.mode === "embedded-replica" ? "Local replica synced with Turso" : "Connected to Turso"
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const lastSyncDate = state?.lastSync ? new Date(state.lastSync) : null;
  const hasError = !!state?.lastError;
  const isDisabled = state?.mode === "disabled";

  const label = !online
    ? "Offline"
    : syncing
    ? "Syncing…"
    : isDisabled
    ? "Local only"
    : hasError
    ? "Sync error"
    : lastSyncDate
    ? `Synced ${formatAgo(lastSyncDate)}`
    : "Click to sync";

  const Icon = !online ? CloudOff : syncing ? RefreshCw : hasError || isDisabled ? Cloud : lastSyncDate ? Check : Cloud;

  const tone = !online || hasError
    ? "border-[#F43F5E]/30 bg-[#F43F5E]/10 text-[#F43F5E]"
    : isDisabled
    ? "border-white/10 bg-white/5 text-[#9CA3AF]"
    : syncing
    ? "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary-hover)]"
    : "border-white/10 bg-white/5 text-[#9CA3AF] hover:text-white hover:border-white/20";

  return (
    <button
      onClick={runSync}
      disabled={syncing}
      title={
        hasError
          ? `Sync error: ${state?.lastError}`
          : `${label}${state ? ` · ${state.message ?? state.mode}` : ""}`
      }
      className={`group relative flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-medium transition-colors ${tone}`}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`absolute inline-flex h-full w-full rounded-full ${
            online && !hasError ? "bg-[#10B981]" : "bg-[#F43F5E]"
          } ${online && !hasError ? "animate-ping opacity-50" : ""}`}
        />
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            online && !hasError ? "bg-[#10B981]" : "bg-[#F43F5E]"
          }`}
        />
      </span>
      <Icon className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
      <AnimatePresence mode="wait">
        <motion.span
          key={label}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 4 }}
          className="hidden md:inline"
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

function formatAgo(d: Date) {
  const sec = Math.round((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return d.toLocaleDateString();
}
