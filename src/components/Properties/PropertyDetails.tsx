import React from 'react';
import { Property } from '../../types/property';
import { MediaManager } from '../MediaCapture';
import { 
  XMarkIcon,
  HomeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  MapPinIcon,
  PencilIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

interface PropertyDetailsProps {
  property: Property;
  onClose: () => void;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
  onViewEvaluations?: (property: Property) => void;
}
const [showMedia, setShowMedia] = useState(false);

export const PropertyDetails: React.FC<PropertyDetailsProps> = ({
  property,
  onClose,
  onEdit,
  onDelete,
  onViewEvaluations,
}) => {
  const [showMedia, setShowMedia] = useState(false);
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (showMedia) {
    return <MediaManager propertyId={property.id} propertyAddress={property.address} />;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Property Details</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(property)}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              aria-label="Edit property"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            {onViewEvaluations && (
              <button
                onClick={() => onViewEvaluations(property)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                aria-label="View evaluations"
              >
                <ClipboardDocumentListIcon className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setShowMedia(true)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              aria-label="View media"
            >
              <PhotoIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(property)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Delete property"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close details"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Address and Price */}
          <div className="mb-8">
            <div className="flex items-start mb-2">
              <MapPinIcon className="w-5 h-5 text-gray-400 mr-2 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {property.address}
                </h3>
                <p className="text-lg text-gray-600">{property.neighborhood}</p>
              </div>
            </div>
            
            <div className="flex items-center mt-4">
              <CurrencyDollarIcon className="w-8 h-8 text-indigo-600 mr-2" />
              <span className="text-3xl font-bold text-indigo-600">
                {formatPrice(property.price)}
              </span>
            </div>
          </div>

          {/* Property Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <HomeIcon className="w-8 h-8 text-gray-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {property.bedrooms}
              </div>
              <div className="text-sm text-gray-600">
                {property.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-8 h-8 text-gray-600 text-2xl">🚿</div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {property.bathrooms}
              </div>
              <div className="text-sm text-gray-600">
                {property.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <CalendarIcon className="w-8 h-8 text-gray-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {property.year_built}
              </div>
              <div className="text-sm text-gray-600">Year Built</div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Property Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Property ID:</span>
                <span className="ml-2 text-gray-600 font-mono">{property.id}</span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Date Added:</span>
                <span className="ml-2 text-gray-600">{formatDate(property.created_at)}</span>
              </div>
              
              {property.updated_at !== property.created_at && (
                <div>
                  <span className="font-medium text-gray-700">Last Updated:</span>
                  <span className="ml-2 text-gray-600">{formatDate(property.updated_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Property Age */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <CalendarIcon className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">
                Property Age: {new Date().getFullYear() - property.year_built} years old
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Close
          </button>
          {onViewEvaluations && (
            <button
              onClick={() => onViewEvaluations(property)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              View Evaluations
            </button>
          )}
          <button
            onClick={() => setShowMedia(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            View Media
          </button>
          <button
            onClick={() => onEdit(property)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Edit Property
          </button>
        </div>
      </div>
    </div>
  );
};