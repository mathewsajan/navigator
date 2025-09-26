import React from 'react';
import { Property } from '../../types/property';
import { 
  HomeIcon, 
  CurrencyDollarIcon, 
  CalendarIcon,
  PencilIcon,
  TrashIcon 
} from '@heroicons/react/24/outline';

interface PropertyCardProps {
  property: Property;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
  onView: (property: Property) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onEdit,
  onDelete,
  onView,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Property Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 
              className="text-lg font-semibold text-gray-900 mb-1 cursor-pointer hover:text-indigo-600 transition-colors"
              onClick={() => onView(property)}
            >
              {property.address}
            </h3>
            <p className="text-sm text-gray-600 mb-2">{property.neighborhood}</p>
            <div className="flex items-center text-2xl font-bold text-indigo-600">
              <CurrencyDollarIcon className="w-6 h-6 mr-1" />
              {formatPrice(property.price)}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-2 ml-4">
            <button
              onClick={() => onEdit(property)}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              aria-label="Edit property"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(property)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Delete property"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Property Details */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <HomeIcon className="w-4 h-4 text-gray-400 mr-1" />
              <span className="text-sm font-medium text-gray-900">{property.bedrooms}</span>
            </div>
            <p className="text-xs text-gray-500">Bedrooms</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <div className="w-4 h-4 text-gray-400 mr-1">🚿</div>
              <span className="text-sm font-medium text-gray-900">{property.bathrooms}</span>
            </div>
            <p className="text-xs text-gray-500">Bathrooms</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <CalendarIcon className="w-4 h-4 text-gray-400 mr-1" />
              <span className="text-sm font-medium text-gray-900">{property.year_built}</span>
            </div>
            <p className="text-xs text-gray-500">Year Built</p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Added {formatDate(property.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
};