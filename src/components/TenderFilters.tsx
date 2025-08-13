import React from 'react'
import { TenderFilters, TenderSort } from '@/types/tender'

interface TenderFiltersProps {
  filters: TenderFilters
  onFiltersChange: (filters: TenderFilters) => void
  sort: TenderSort
  onSortChange: (sort: TenderSort) => void
}

export function TenderFiltersComponent({
  filters,
  onFiltersChange,
  sort,
  onSortChange,
}: TenderFiltersProps) {

  const updateFilter = (key: keyof TenderFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const resetFilters = () => {
    onFiltersChange({})
  }

  return (
    <div className="card p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">Filtry</h3>
        <button
          onClick={resetFilters}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Vymazat
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Vyhledávání */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vyhledávání
          </label>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Název, zadavatel, popis..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Zadavatel */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Zadavatel
          </label>
          <input
            type="text"
            value={filters.buyer || ''}
            onChange={(e) => updateFilter('buyer', e.target.value)}
            placeholder="Název zadavatele"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Stav */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stav
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => updateFilter('status', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Všechny stavy</option>
            <option value="neukoncena">Neukončena</option>
            <option value="zadana">Zadána</option>
            <option value="zrusena">Zrušena</option>
            <option value="plneni">Plnění</option>
          </select>
        </div>

        {/* Deadline od */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deadline od
          </label>
          <input
            type="date"
            value={filters.deadline_from || ''}
            onChange={(e) => updateFilter('deadline_from', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Deadline do */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deadline do
          </label>
          <input
            type="date"
            value={filters.deadline_to || ''}
            onChange={(e) => updateFilter('deadline_to', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Řazení */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Řadit podle
          </label>
          <select
            value={`${sort.field}-${sort.direction}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-') as [keyof TenderSort['field'], 'asc' | 'desc']
              onSortChange({ field, direction })
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="created_at-desc">Nejnovější</option>
            <option value="created_at-asc">Nejstarší</option>
            <option value="deadline-asc">Deadline (nejbližší)</option>
            <option value="deadline-desc">Deadline (nejdržší)</option>
            <option value="budget_value-desc">Hodnota (nejvyšší)</option>
            <option value="budget_value-asc">Hodnota (nejnižší)</option>
            <option value="title-asc">Název (A-Z)</option>
            <option value="title-desc">Název (Z-A)</option>
          </select>
        </div>

        {/* Budget rozsah */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rozpočet (CZK)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Od"
              value={filters.budget_min || ''}
              onChange={(e) => updateFilter('budget_min', e.target.value ? Number(e.target.value) : undefined)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Do"
              value={filters.budget_max || ''}
              onChange={(e) => updateFilter('budget_max', e.target.value ? Number(e.target.value) : undefined)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
