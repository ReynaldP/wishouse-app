import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ViewMode = 'grid' | 'list';
type SortBy = 'created_at' | 'price' | 'name' | 'planned_date' | 'priority';
type SortOrder = 'asc' | 'desc';

interface UIStore {
  // View settings
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Sorting
  sortBy: SortBy;
  sortOrder: SortOrder;
  setSortBy: (sortBy: SortBy) => void;
  setSortOrder: (order: SortOrder) => void;
  toggleSortOrder: () => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Modals
  productFormOpen: boolean;
  setProductFormOpen: (open: boolean) => void;
  editingProductId: string | null;
  setEditingProductId: (id: string | null) => void;

  categoryFormOpen: boolean;
  setCategoryFormOpen: (open: boolean) => void;
  editingCategoryId: string | null;
  setEditingCategoryId: (id: string | null) => void;

  // Product detail sheet
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;

  // Filters panel (mobile)
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;

  // Quick Add
  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
  lastUsedCategoryId: string | null;
  setLastUsedCategoryId: (id: string | null) => void;

  // Web Clipper
  webClipperOpen: boolean;
  setWebClipperOpen: (open: boolean) => void;
  webClipperUrl: string | null;
  setWebClipperUrl: (url: string | null) => void;
  openWebClipper: (url?: string) => void;

  // Comparison Mode
  comparisonMode: boolean;
  setComparisonMode: (mode: boolean) => void;
  comparisonProductIds: string[];
  addToComparison: (productId: string) => void;
  removeFromComparison: (productId: string) => void;
  clearComparison: () => void;
  toggleProductComparison: (productId: string) => void;
  comparisonViewOpen: boolean;
  setComparisonViewOpen: (open: boolean) => void;

  // Comparison History
  comparisonHistory: Array<{ id: string; productIds: string[]; createdAt: string; winnerId?: string }>;
  addToComparisonHistory: (productIds: string[], winnerId?: string) => void;
  clearComparisonHistory: () => void;

  // Chart Drilldown
  drilldownCategoryId: string | null;
  setDrilldownCategoryId: (id: string | null) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // View settings
      viewMode: 'grid',
      setViewMode: (mode) => set({ viewMode: mode }),

      // Sorting
      sortBy: 'created_at',
      sortOrder: 'desc',
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (order) => set({ sortOrder: order }),
      toggleSortOrder: () => set((state) => ({
        sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc'
      })),

      // Sidebar
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // Modals - not persisted
      productFormOpen: false,
      setProductFormOpen: (open) => set({ productFormOpen: open }),
      editingProductId: null,
      setEditingProductId: (id) => set({ editingProductId: id }),

      categoryFormOpen: false,
      setCategoryFormOpen: (open) => set({ categoryFormOpen: open }),
      editingCategoryId: null,
      setEditingCategoryId: (id) => set({ editingCategoryId: id }),

      // Product detail
      selectedProductId: null,
      setSelectedProductId: (id) => set({ selectedProductId: id }),

      // Filters panel
      filtersOpen: false,
      setFiltersOpen: (open) => set({ filtersOpen: open }),

      // Quick Add
      quickAddOpen: false,
      setQuickAddOpen: (open) => set({ quickAddOpen: open }),
      lastUsedCategoryId: null,
      setLastUsedCategoryId: (id) => set({ lastUsedCategoryId: id }),

      // Web Clipper
      webClipperOpen: false,
      setWebClipperOpen: (open) => set({ webClipperOpen: open, webClipperUrl: open ? null : null }),
      webClipperUrl: null,
      setWebClipperUrl: (url) => set({ webClipperUrl: url }),
      openWebClipper: (url) => set({ webClipperOpen: true, webClipperUrl: url || null }),

      // Comparison Mode
      comparisonMode: false,
      setComparisonMode: (mode) => set({
        comparisonMode: mode,
        comparisonProductIds: mode ? [] : [],
        comparisonViewOpen: false
      }),
      comparisonProductIds: [],
      addToComparison: (productId) => set((state) => {
        if (state.comparisonProductIds.length >= 4) return state;
        if (state.comparisonProductIds.includes(productId)) return state;
        return { comparisonProductIds: [...state.comparisonProductIds, productId] };
      }),
      removeFromComparison: (productId) => set((state) => ({
        comparisonProductIds: state.comparisonProductIds.filter(id => id !== productId)
      })),
      clearComparison: () => set({ comparisonProductIds: [], comparisonMode: false, comparisonViewOpen: false }),
      toggleProductComparison: (productId) => set((state) => {
        if (state.comparisonProductIds.includes(productId)) {
          return { comparisonProductIds: state.comparisonProductIds.filter(id => id !== productId) };
        }
        if (state.comparisonProductIds.length >= 4) return state;
        return { comparisonProductIds: [...state.comparisonProductIds, productId] };
      }),
      comparisonViewOpen: false,
      setComparisonViewOpen: (open) => set({ comparisonViewOpen: open }),

      // Comparison History
      comparisonHistory: [],
      addToComparisonHistory: (productIds, winnerId) => set((state) => {
        const newItem = {
          id: Date.now().toString(),
          productIds,
          createdAt: new Date().toISOString(),
          winnerId,
        };
        // Keep only the last 10 comparisons
        const history = [newItem, ...state.comparisonHistory].slice(0, 10);
        return { comparisonHistory: history };
      }),
      clearComparisonHistory: () => set({ comparisonHistory: [] }),

      // Chart Drilldown
      drilldownCategoryId: null,
      setDrilldownCategoryId: (id) => set({ drilldownCategoryId: id })
    }),
    {
      name: 'wishouse-ui',
      partialize: (state) => ({
        viewMode: state.viewMode,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        lastUsedCategoryId: state.lastUsedCategoryId,
        comparisonHistory: state.comparisonHistory
      })
    }
  )
);
