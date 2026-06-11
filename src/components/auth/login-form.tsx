"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package } from "lucide-react";
import { motion } from "framer-motion";
import { SparklesText } from "@/components/magic/sparkles-text";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/40">
            <Package className="h-6 w-6 text-primary-foreground" />
          </div>
          <SparklesText text="StockSense" className="text-2xl" />
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        <form action={action} className="glass rounded-2xl p-6 space-y-4">
          {state?.message && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {state.message}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Email address
            </label>
            <Input
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            {state?.errors?.email && (
              <p className="mt-1 text-xs text-destructive">{state.errors.email[0]}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Password
            </label>
            <Input
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            {state?.errors?.password && (
              <p className="mt-1 text-xs text-destructive">{state.errors.password[0]}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          StockSense — Inventory Management · Tanzania
        </p>
      </motion.div>
    </div>
  );
}
