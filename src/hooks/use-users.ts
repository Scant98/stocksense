"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface NewUser {
  name: string;
  email: string;
  password: string;
  role: "admin" | "manager" | "user";
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export function useUsers() {
  return useQuery<ManagedUser[]>({
    queryKey: ["users"],
    queryFn: () => api("/api/users"),
  });
}

export function useAddUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NewUser) =>
      api<ManagedUser>("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/users/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useWipeData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (scope: string[]) =>
      api("/api/admin/wipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope }),
      }),
    onSuccess: () => qc.invalidateQueries(),
  });
}
