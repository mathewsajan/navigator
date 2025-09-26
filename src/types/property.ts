export interface Property {
  id: string;
  address: string;
  neighborhood: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  year_built: number;
  team_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyFormData {
  address: string;
  neighborhood: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  year_built: number;
}

export interface PropertyFilters {
  search: string;
  minPrice: number | null;
  maxPrice: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  neighborhood: string;
}

export type SortField = 'price' | 'bedrooms' | 'bathrooms' | 'year_built' | 'created_at';
export type SortDirection = 'asc' | 'desc';

export interface PropertySort {
  field: SortField;
  direction: SortDirection;
}