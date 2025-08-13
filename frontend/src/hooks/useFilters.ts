import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TenderFilters, TenderSort } from '@/types/tender';

interface FiltersState {
  filters: TenderFilters;
  sort: TenderSort;
  sidebarOpen: boolean;
  setFilters: (filters: Partial<TenderFilters>) => void;
  setSort: (sort: TenderSort) => void;
  setSidebarOpen: (open: boolean) => void;
  resetFilters: () => void;
}

const defaultFilters: TenderFilters = {
  q: '',
  source: [],
  status: [],
  region: '',
  cpv: '',
  price_min: undefined,
  price_max: undefined,
  date_from: '',
  date_to: ''
};

const defaultSort: TenderSort = {
  field: 'publication_date',
  dir: 'desc'
};

export const useFilters = create<FiltersState>()(
  persist(
    (set) => ({
      filters: defaultFilters,
      sort: defaultSort,
      sidebarOpen: true,
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters }
        })),
      setSort: (sort) => set({ sort }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      resetFilters: () => set({ filters: defaultFilters, sort: defaultSort })
    }),
    {
      name: 'tender-filters',
      partialize: (state) => ({ filters: state.filters, sort: state.sort })
    }
  )
);
