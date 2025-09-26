import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Property, PropertyFormData, PropertyFilters, PropertySort } from '../types/property';
import toast from 'react-hot-toast';

export const useProperties = () => {
  const { user, userProfile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PropertyFilters>({
    search: '',
    minPrice: null,
    maxPrice: null,
    bedrooms: null,
    bathrooms: null,
    neighborhood: '',
  });
  const [sort, setSort] = useState<PropertySort>({
    field: 'created_at',
    direction: 'desc',
  });

  // Fetch properties for the user's team
  const fetchProperties = useCallback(async () => {
    if (!user || !userProfile?.team_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('properties')
        .select('*')
        .eq('team_id', userProfile.team_id)
        .order(sort.field, { ascending: sort.direction === 'asc' });

      if (fetchError) throw fetchError;

      setProperties(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch properties';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile?.team_id, sort]);

  // Check for duplicate address
  const checkDuplicateAddress = useCallback(async (address: string, excludeId?: string): Promise<boolean> => {
    if (!userProfile?.team_id) return false;

    try {
      let query = supabase
        .from('properties')
        .select('id')
        .eq('team_id', userProfile.team_id)
        .ilike('address', address.trim());

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data?.length || 0) > 0;
    } catch (err) {
      console.error('Error checking duplicate address:', err);
      return false;
    }
  }, [userProfile?.team_id]);

  // Add new property
  const addProperty = useCallback(async (propertyData: PropertyFormData): Promise<boolean> => {
    if (!user || !userProfile?.team_id) {
      toast.error('Authentication required');
      return false;
    }

    try {
      // Check for duplicate address
      const isDuplicate = await checkDuplicateAddress(propertyData.address);
      if (isDuplicate) {
        toast.error('A property with this address already exists in your team');
        return false;
      }

      const { data, error } = await supabase
        .from('properties')
        .insert([
          {
            ...propertyData,
            team_id: userProfile.team_id,
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setProperties(prev => [data, ...prev]);
      toast.success('Property added successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add property';
      toast.error(errorMessage);
      return false;
    }
  }, [user, userProfile?.team_id, checkDuplicateAddress]);

  // Update property
  const updateProperty = useCallback(async (id: string, propertyData: PropertyFormData): Promise<boolean> => {
    if (!user || !userProfile?.team_id) {
      toast.error('Authentication required');
      return false;
    }

    try {
      // Check for duplicate address (excluding current property)
      const isDuplicate = await checkDuplicateAddress(propertyData.address, id);
      if (isDuplicate) {
        toast.error('A property with this address already exists in your team');
        return false;
      }

      const { data, error } = await supabase
        .from('properties')
        .update(propertyData)
        .eq('id', id)
        .eq('team_id', userProfile.team_id)
        .select()
        .single();

      if (error) throw error;

      setProperties(prev =>
        prev.map(property => (property.id === id ? data : property))
      );
      toast.success('Property updated successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update property';
      toast.error(errorMessage);
      return false;
    }
  }, [user, userProfile?.team_id, checkDuplicateAddress]);

  // Delete property
  const deleteProperty = useCallback(async (id: string): Promise<boolean> => {
    if (!user || !userProfile?.team_id) {
      toast.error('Authentication required');
      return false;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id)
        .eq('team_id', userProfile.team_id);

      if (error) throw error;

      setProperties(prev => prev.filter(property => property.id !== id));
      toast.success('Property deleted successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete property';
      toast.error(errorMessage);
      return false;
    }
  }, [user, userProfile?.team_id]);

  // Get property by ID
  const getProperty = useCallback((id: string): Property | undefined => {
    return properties.find(property => property.id === id);
  }, [properties]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...properties];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        property =>
          property.address.toLowerCase().includes(searchLower) ||
          property.neighborhood.toLowerCase().includes(searchLower)
      );
    }

    // Apply price filters
    if (filters.minPrice !== null) {
      filtered = filtered.filter(property => property.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== null) {
      filtered = filtered.filter(property => property.price <= filters.maxPrice!);
    }

    // Apply bedroom filter
    if (filters.bedrooms !== null) {
      filtered = filtered.filter(property => property.bedrooms === filters.bedrooms);
    }

    // Apply bathroom filter
    if (filters.bathrooms !== null) {
      filtered = filtered.filter(property => property.bathrooms === filters.bathrooms);
    }

    // Apply neighborhood filter
    if (filters.neighborhood) {
      filtered = filtered.filter(property =>
        property.neighborhood.toLowerCase().includes(filters.neighborhood.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sort.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sort.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    setFilteredProperties(filtered);
  }, [properties, filters, sort]);

  // Set up real-time subscription
  useEffect(() => {
    if (!userProfile?.team_id) return;

    const subscription = supabase
      .channel('properties_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'properties',
          filter: `team_id=eq.${userProfile.team_id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setProperties(prev => [payload.new as Property, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setProperties(prev =>
              prev.map(property =>
                property.id === payload.new.id ? (payload.new as Property) : property
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setProperties(prev =>
              prev.filter(property => property.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userProfile?.team_id]);

  // Initial fetch
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return {
    properties: filteredProperties,
    loading,
    error,
    filters,
    sort,
    addProperty,
    updateProperty,
    deleteProperty,
    getProperty,
    setFilters,
    setSort,
    refetch: fetchProperties,
    checkDuplicateAddress,
  };
};