import { useState } from 'react';
import { TenderFilters } from '@/types/tender';
import { Search, Filter, X } from 'lucide-react';

interface TenderFiltersProps {
  filters: TenderFilters;
  onFiltersChange: (filters: TenderFilters) => void;
}

export function TenderFiltersComponent({ filters, onFiltersChange }: TenderFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof TenderFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && 
    (Array.isArray(value) ? value.length > 0 : true)
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Hledat v zakázkách..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <Filter className="w-4 h-4" />
          <span>Filtry</span>
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md"
          >
            <X className="w-4 h-4" />
            <span>Vymazat</span>
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zadavatel
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={filters.buyer || ''}
              onChange={(e) => updateFilter('buyer', e.target.value)}
              placeholder="Název zadavatele"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={filters.status || ''}
              onChange={(e) => updateFilter('status', e.target.value)}
            >
              <option value="">Všechny</option>
              <option value="neukoncena">Neukončená</option>
              <option value="zadana">Zadaná</option>
              <option value="zrusena">Zrušená</option>
              <option value="plneni">Plnění</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Termín od
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={filters.deadlineFrom || ''}
              onChange={(e) => updateFilter('deadlineFrom', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Termín do
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={filters.deadlineTo || ''}
              onChange={(e) => updateFilter('deadlineTo', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
