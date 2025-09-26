import React, { useState } from 'react';
import { Property } from '../../types/property';
import { useProperties } from '../../hooks/useProperties';
import { PropertyList } from './PropertyList';
import { PropertyFilters } from './PropertyFilters';
import { PropertyForm } from './PropertyForm';
import { PropertyDetails } from './PropertyDetails';
import { DeleteConfirmation } from './DeleteConfirmation';
import { PlusIcon } from '@heroicons/react/24/outline';

type ModalType = 'add' | 'edit' | 'view' | 'delete' | null;

export const PropertiesManager: React.FC = () => {
  const {
    properties,
    loading,
    error,
    filters,
    sort,
    addProperty,
    updateProperty,
    deleteProperty,
    setFilters,
    setSort,
    checkDuplicateAddress,
  } = useProperties();

  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Get total count before filtering
  const totalCount = properties.length;

  const handleAddProperty = () => {
    setSelectedProperty(null);
    setModalType('add');
  };

  const handleEditProperty = (property: Property) => {
    setSelectedProperty(property);
    setModalType('edit');
  };

  const handleViewProperty = (property: Property) => {
    setSelectedProperty(property);
    setModalType('view');
  };

  const handleDeleteProperty = (property: Property) => {
    setSelectedProperty(property);
    setModalType('delete');
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedProperty(null);
  };

  const handleFormSubmit = async (formData: any) => {
    if (modalType === 'add') {
      return await addProperty(formData);
    } else if (modalType === 'edit' && selectedProperty) {
      return await updateProperty(selectedProperty.id, formData);
    }
    return false;
  };

  const handleDeleteConfirm = async (property: Property) => {
    return await deleteProperty(property.id);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Properties</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
            <p className="mt-2 text-gray-600">
              Manage your real estate portfolio and track property details
            </p>
          </div>
          
          <button
            onClick={handleAddProperty}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Property
          </button>
        </div>

        {/* Filters */}
        <PropertyFilters
          filters={filters}
          sort={sort}
          onFiltersChange={setFilters}
          onSortChange={setSort}
          totalCount={totalCount}
          filteredCount={properties.length}
        />

        {/* Property List */}
        <PropertyList
          properties={properties}
          loading={loading}
          onEdit={handleEditProperty}
          onDelete={handleDeleteProperty}
          onView={handleViewProperty}
        />

        {/* Floating Action Button (Mobile) */}
        <button
          onClick={handleAddProperty}
          className="fixed bottom-6 right-6 sm:hidden w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors z-40"
          aria-label="Add property"
        >
          <PlusIcon className="w-6 h-6" />
        </button>

        {/* Modals */}
        {(modalType === 'add' || modalType === 'edit') && (
          <PropertyForm
            property={selectedProperty || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseModal}
            checkDuplicateAddress={checkDuplicateAddress}
          />
        )}

        {modalType === 'view' && selectedProperty && (
          <PropertyDetails
            property={selectedProperty}
            onClose={handleCloseModal}
            onEdit={handleEditProperty}
            onDelete={handleDeleteProperty}
          />
        )}

        {modalType === 'delete' && selectedProperty && (
          <DeleteConfirmation
            property={selectedProperty}
            onConfirm={handleDeleteConfirm}
            onCancel={handleCloseModal}
          />
        )}
      </div>
    </div>
  );
};