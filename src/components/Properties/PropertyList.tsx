import React from 'react';
import { Property } from '../../types/property';
import { PropertyCard } from './PropertyCard';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { HomeIcon } from '@heroicons/react/24/outline';

interface PropertyListProps {
  properties: Property[];
  loading: boolean;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
  onView: (property: Property) => void;
  onViewEvaluations?: (property: Property) => void;
}

export const PropertyList: React.FC<PropertyListProps> = ({
  properties,
  loading,
  onEdit,
  onDelete,
  onView,
  onViewEvaluations,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <HomeIcon className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          Get started by adding your first property to begin tracking your real estate portfolio.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          onViewEvaluations={onViewEvaluations}
        />
      ))}
    </div>
  );
};