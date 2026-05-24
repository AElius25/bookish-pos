import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  title: string;
  author: string;
  price: number;
  quantity: number;
  stock: number;
  cover_url?: string | null;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">) => void;
  update: (id: string, patch: Partial<Pick<CartItem, "quantity" | "price">>) => void;
  remove: (id: string) => void;
  clear: () => void;
  subtotal: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((s) => {
          const existing = s.items.find((i) => i.id === item.id);
          if (existing) {
            const nextQty = Math.min(existing.quantity + 1, item.stock);
            return {
              items: s.items.map((i) =>
                i.id === item.id ? { ...i, quantity: nextQty } : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, quantity: 1 }] };
        }),
      update: (id, patch) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id
              ? {
                  ...i,
                  ...patch,
                  quantity:
                    patch.quantity !== undefined
                      ? Math.max(1, Math.min(patch.quantity, i.stock))
                      : i.quantity,
                }
              : i,
          ),
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "bookstore-cart" },
  ),
);
