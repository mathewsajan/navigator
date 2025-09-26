import React from 'react';
import { PropertyFilters as Filters, PropertySort, SortField, SortDirection } from '../../types/property';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

interface PropertyFiltersProps {
  filters: Filters;
  sort: PropertySort;
  onFiltersChange: (filters: Filters) => void;
  onSortChange: (sort: PropertySort) => void;
  totalCount: number;
  filteredCount: number;
}

export const PropertyFilters: React.FC<PropertyFiltersProps> = ({
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  totalCount,
  filteredCount,
}) => {
  const handleFilterChange = (key: keyof Filters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleSortChange = (field: SortField) => {
    const newDirection: SortDirection = 
      sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc';
    
    onSortChange({
      field,
      direction: newDirection,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      minPrice: null,
      maxPrice: null,
      bedrooms: null,
      bathrooms: null,
      neighborhood: '',
    });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.minPrice !== null || 
    filters.maxPrice !== null || 
    filters.bedrooms !== null || 
    filters.bathrooms !== null || 
    filters.neighborhood;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by address or neighborhood..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Price
          </label>
          <input
            type="number"
            placeholder="$0"
            value={filters.minPrice || ''}
            onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : null)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Price
          </label>
          <input
            type="number"
            placeholder="No limit"
            value={filters.maxPrice || ''}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : null)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Bedrooms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bedrooms
          </label>
          <select
            value={filters.bedrooms || ''}
            onChange={(e) => handleFilterChange('bedrooms', e.target.value ? Number(e.target.value) : null)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Any</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5+</option>
          </select>
        </div>

        {/* Bathrooms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bathrooms
          </label>
          <select
            value={filters.bathrooms || ''}
            onChange={(e) => handleFilterChange('bathrooms', e.target.value ? Number(e.target.value) : null)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Any</option>
            <option value="1">1</option>
            <option value="1.5">1.5</option>
            <option value="2">2</option>
            <option value="2.5">2.5</option>
            <option value="3">3</option>
            <option value="3.5">3.5</option>
            <option value="4">4+</option>
          </select>
        </div>

        {/* Neighborhood */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Neighborhood
          </label>
          <input
            type="text"
            placeholder="Any neighborhood"
            value={filters.neighborhood}
            onChange={(e) => handleFilterChange('neighborhood', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Sort and Results */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
          </div>
          
          <div className="flex space-x-2">
            {[
              { field: 'price' as SortField, label: 'Price' },
              { field: 'bedrooms' as SortField, label: 'Beds' },
              { field: 'bathrooms' as SortField, label: 'Baths' },
              { field: 'year_built' as SortField, label: 'Year' },
              { field: 'created_at' as SortField, label: 'Date Added' },
            ].map(({ field, label }) => (
              <button
                key={field}
                onClick={() => handleSortChange(field)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  sort.field === field
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
                {sort.field === field && (
                  <span className="ml-1">
                    {sort.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end space-x-4">
          <div className="text-sm text-gray-600">
            Showing {filteredCount} of {totalCount} properties
          </div>
          
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};