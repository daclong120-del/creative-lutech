import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface TableLayout {
  visibleColumns: string[];
  pageSize: number;
}

interface UIState {
  theme: "light" | "dark" | "system";
  sidebarCollapsed: boolean;
  locale: string;
  tableLayouts: Record<string, TableLayout>;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLocale: (locale: string) => void;
  setTableLayout: (tableKey: string, layout: Partial<TableLayout>) => void;
}

const DEFAULT_STATE = {
  theme: "system" as const,
  sidebarCollapsed: false,
  locale: "vi",
  tableLayouts: {} as Record<string, TableLayout>,
};

/**
 * Zustand Store quản lý toàn bộ cấu hình hiển thị (UI Preferences) của Dashboard
 * Tự động đồng bộ xuống localStorage và hỗ trợ Schema Migration.
 */
export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      setTheme: (theme) => set({ theme }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setLocale: (locale) => set({ locale }),
      setTableLayout: (tableKey, layout) =>
        set((state) => ({
          tableLayouts: {
            ...state.tableLayouts,
            [tableKey]: {
              visibleColumns: layout.visibleColumns ?? state.tableLayouts[tableKey]?.visibleColumns ?? [],
              pageSize: layout.pageSize ?? state.tableLayouts[tableKey]?.pageSize ?? 10,
            },
          },
        })),
    }),
    {
      name: "sinomedia-ui-preferences", // Key lưu trong localStorage
      storage: createJSONStorage(() => localStorage),
      version: 1, // Schema version bắt đầu từ 1
      migrate: (persistedState: unknown, version: number) => {
        console.log(`[UI Store] Migrating from version ${version} to 1`);
        
        // Khởi tạo state mặc định nếu dữ liệu cũ trống
        const state = (persistedState ?? {}) as Partial<UIState>;

        if (version === 0) {
          // Xử lý tương thích ngược: Nếu dữ liệu cũ thiếu tableLayouts, bổ sung mặc định
          if (!state.tableLayouts) {
            state.tableLayouts = {};
          }
        }

        return state as UIState;
      },
    }
  )
);
