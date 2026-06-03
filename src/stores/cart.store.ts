import { create } from "zustand";

import type { CartLine, MenuItem } from "@/types/brewboard";

type CartState = {
  lines: CartLine[];
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: string) => void;
  setQuantity: (itemId: string, quantity: number) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  lines: [],
  addItem: (item) =>
    set((state) => {
      const existing = state.lines.find((line) => line.item.id === item.id);

      if (existing) {
        return {
          lines: state.lines.map((line) =>
            line.item.id === item.id ? { ...line, quantity: line.quantity + 1 } : line
          )
        };
      }

      return { lines: [...state.lines, { item, quantity: 1 }] };
    }),
  removeItem: (itemId) => set((state) => ({ lines: state.lines.filter((line) => line.item.id !== itemId) })),
  setQuantity: (itemId, quantity) =>
    set((state) => ({
      lines: quantity <= 0
        ? state.lines.filter((line) => line.item.id !== itemId)
        : state.lines.map((line) => (line.item.id === itemId ? { ...line, quantity } : line))
    })),
  clear: () => set({ lines: [] })
}));
