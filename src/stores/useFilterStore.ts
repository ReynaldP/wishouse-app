import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductFilters, Status, Priority } from '@/types';

interface FilterStore {
  filters: ProductFilters;
  setFilters: (filters: Partial<ProductFilters>) => void;
  setCategory: (categoryId: string | undefined) => void;
  setSubcategory: (subcategoryId: string | undefined) => void;
  setStatus: (status: Status | undefined) => void;
  setPriority: (priority: Priority | undefined) => void;
  setTag: (tagId: string | undefined) => void;
  setFavorites: (favoritesOnly: boolean | undefined) => void;
  setSearch: (search: string | undefined) => void;
  resetFilters: () => void;
  hasActiveFilters: () => boolean;
}

const initialFilters: ProductFilters = {};

export const useFilterStore = create<FilterStore>()(
  persist(
    (set, get) => ({
      filters: initialFilters,

      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters }
        })),

      setCategory: (categoryId) =>
        set((state) => ({
          filters: {
            ...state.filters,
            category_id: categoryId,
            subcategory_id: undefined // Reset subcategory when category changes
          }
        })),

      setSubcategory: (subcategoryId) =>
        set((state) => ({
          filters: { ...state.filters, subcategory_id: subcategoryId }
        })),

      setStatus: (status) =>
        set((state) => ({
          filters: { ...state.filters, status }
        })),

      setPriority: (priority) =>
        set((state) => ({
          filters: { ...state.filters, priority }
        })),

      setTag: (tagId) =>
        set((state) => ({
          filters: { ...state.filters, tag_id: tagId }
        })),

      setFavorites: (favoritesOnly) =>
        set((state) => ({
          filters: { ...state.filters, is_favorite: favoritesOnly }
        })),

      setSearch: (search) =>
        set((state) => ({
          filters: { ...state.filters, search: search || undefined }
        })),

      resetFilters: () => set({ filters: initialFilters }),

      hasActiveFilters: () => {
        const { filters } = get();
        return Object.values(filters).some(v => v !== undefined && v !== '');
      }
    }),
    {
      name: 'wishouse-filters',
      partialize: (state) => ({ filters: state.filters })
    }
  )
);
