import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  productId: string;
  quantity: number;
  /** Manual price override set at the till; undefined means "use the selling price". */
  unitPrice?: number;
}

interface CartState {
  lines: CartLine[];
  add: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  setPrice: (productId: string, unitPrice: number | undefined) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

// Persisted so a refresh, or a detour to "add the unknown product", doesn't lose the basket.
// Hydration is manual (see PosPage) to keep server and client markup identical.
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (productId) =>
        set((state) => {
          const existing = state.lines.find((l) => l.productId === productId);
          if (existing) {
            return {
              lines: state.lines.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l)),
            };
          }
          return { lines: [...state.lines, { productId, quantity: 1 }] };
        }),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.productId !== productId)
              : state.lines.map((l) => (l.productId === productId ? { ...l, quantity } : l)),
        })),
      setPrice: (productId, unitPrice) =>
        set((state) => ({
          lines: state.lines.map((l) => (l.productId === productId ? { ...l, unitPrice } : l)),
        })),
      remove: (productId) => set((state) => ({ lines: state.lines.filter((l) => l.productId !== productId) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "stocksense:cart", skipHydration: true }
  )
);
