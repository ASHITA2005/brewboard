import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { TableSession } from "@/types/brewboard";

type TableState = {
  activeTable: TableSession | null;
  customerName: string;
  setCustomerName: (name: string) => void;
  setActiveTable: (table: TableSession | null) => void;
  closeTable: () => void;
};

export const useTableStore = create<TableState>()(
  persist(
    (set) => ({
      activeTable: null,
      customerName: "Guest",
      setCustomerName: (name) => set({ customerName: name.trim() || "Guest" }),
      setActiveTable: (table) => {
        set({ activeTable: table });
        if (typeof window !== "undefined") {
          if (table) {
            document.cookie = `brewboard_table_session=${encodeURIComponent(JSON.stringify(table))}; path=/; max-age=259200; SameSite=Lax`;
          } else {
            document.cookie = "brewboard_table_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          }
        }
      },
      closeTable: () =>
        set((state) => {
          const updatedTable = state.activeTable ? { ...state.activeTable, isClosed: true } : null;
          if (typeof window !== "undefined") {
            if (updatedTable) {
              document.cookie = `brewboard_table_session=${encodeURIComponent(JSON.stringify(updatedTable))}; path=/; max-age=259200; SameSite=Lax`;
            } else {
              document.cookie = "brewboard_table_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            }
          }
          return { activeTable: updatedTable };
        })
    }),
    {
      name: "brewboard-table-session"
    }
  )
);

