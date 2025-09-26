import React, { useState, useEffect } from 'react';
import { Property, PropertyFormData } from '../../types/property';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../UI/LoadingSpinner';

interface PropertyFormProps {
  property?: Property;
  onSubmit: (data: PropertyFormData) => Promise<boolean>;
  onCancel: () => void;
  checkDuplicateAddress: (address: string, excludeId?: string) => Promise<boolean>;
}

export const PropertyForm: React.FC<PropertyFormProps> = ({
  property,
  onSubmit,
  onCancel,
  checkDuplicateAddress,
}) => {
  const [formData, setFormData] = useState<PropertyFormData>({
    address: property?.address || '',
    neighborhood: property?.neighborhood || '',
    price: property?.price || 0,
    bedrooms: property?.bedrooms || 1,
    bathrooms: property?.bathrooms || 1,
    year_built: property?.year_built || new Date().getFullYear(),
  });

  const [errors, setErrors] = useState<Partial<PropertyFormData>>({});
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  const isEditing = !!property;

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: Partial<PropertyFormData> = {};

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.neighborhood.trim()) {
      newErrors.neighborhood = 'Neighborhood is required';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.bedrooms < 0 || formData.bedrooms > 20) {
      newErrors.bedrooms = 'Bedrooms must be between 0 and 20';
    }

    if (formData.bathrooms < 0 || formData.bathrooms > 20) {
      newErrors.bathrooms = 'Bathrooms must be between 0 and 20';
    }

    const currentYear = new Date().getFullYear();
    if (formData.year_built < 1800 || formData.year_built > currentYear + 5) {
      newErrors.year_built = `Year built must be between 1800 and ${currentYear + 5}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check for duplicate address when address changes
  useEffect(() => {
    const checkDuplicate = async () => {
      if (formData.address.trim() && formData.address !== property?.address) {
        const isDuplicate = await checkDuplicateAddress(
          formData.address,
          property?.id
        );
        setDuplicateWarning(isDuplicate);
      } else {
        setDuplicateWarning(false);
      }
    };

    const timeoutId = setTimeout(checkDuplicate, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.address, property?.address, property?.id, checkDuplicateAddress]);

  const handleInputChange = (field: keyof PropertyFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (duplicateWarning) {
      return;
    }

    setLoading(true);
    try {
      const success = await onSubmit(formData);
      if (success) {
        onCancel(); // Close the form
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Property' : 'Add New Property'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close form"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <input
              type="text"
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                errors.address || duplicateWarning
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
              placeholder="123 Main Street, City, State 12345"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address}</p>
            )}
            {duplicateWarning && (
              <p className="mt-1 text-sm text-red-600">
                A property with this address already exists in your team
              </p>
            )}
          </div>

          {/* Neighborhood */}
          <div>
            <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-1">
              Neighborhood *
            </label>
            <input
              type="text"
              id="neighborhood"
              value={formData.neighborhood}
              onChange={(e) => handleInputChange('neighborhood', e.target.value)}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                errors.neighborhood
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
              placeholder="Downtown, Suburbs, etc."
            />
            {errors.neighborhood && (
              <p className="mt-1 text-sm text-red-600">{errors.neighborhood}</p>
            )}
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="price"
                min="0"
                step="1000"
                value={formData.price || ''}
                onChange={(e) => handleInputChange('price', Number(e.target.value))}
                className={`block w-full pl-7 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                  errors.price
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
                placeholder="500000"
              />
            </div>
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price}</p>
            )}
          </div>

          {/* Bedrooms and Bathrooms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms *
              </label>
              <input
                type="number"
                id="bedrooms"
                min="0"
                max="20"
                value={formData.bedrooms}
                onChange={(e) => handleInputChange('bedrooms', Number(e.target.value))}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                  errors.bedrooms
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
              />
              {errors.bedrooms && (
                <p className="mt-1 text-sm text-red-600">{errors.bedrooms}</p>
              )}
            </div>

            <div>
              <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                Bathrooms *
              </label>
              <input
                type="number"
                id="bathrooms"
                min="0"
                max="20"
                step="0.5"
                value={formData.bathrooms}
                onChange={(e) => handleInputChange('bathrooms', Number(e.target.value))}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                  errors.bathrooms
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
              />
              {errors.bathrooms && (
                <p className="mt-1 text-sm text-red-600">{errors.bathrooms}</p>
              )}
            </div>
          </div>

          {/* Year Built */}
          <div>
            <label htmlFor="year_built" className="block text-sm font-medium text-gray-700 mb-1">
              Year Built *
            </label>
            <input
              type="number"
              id="year_built"
              min="1800"
              max={new Date().getFullYear() + 5}
              value={formData.year_built}
              onChange={(e) => handleInputChange('year_built', Number(e.target.value))}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                errors.year_built
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
            {errors.year_built && (
              <p className="mt-1 text-sm text-red-600">{errors.year_built}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || duplicateWarning}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading && <LoadingSpinner size="sm" className="mr-2" />}
              {isEditing ? 'Update Property' : 'Add Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};