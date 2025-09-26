import React from 'react';
import { Plus, Search, Filter, Chrome as Home } from 'lucide-react';

export const EvaluationPage: React.FC = () => {
  return (
    <div className="p-4 space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Property Evaluation</h2>
          <p className="text-gray-600 text-sm">Evaluate and rate properties with your team</p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Property</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search properties..."
            className="input pl-10"
          />
        </div>
        <button className="btn-secondary flex items-center space-x-2">
          <Filter className="w-4 h-4" />
          <span>Filter</span>
        </button>
      </div>

      {/* Empty State */}
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Home className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">
          Start by adding your first property to begin the evaluation process with your team.
        </p>
        <button className="btn-primary">
          Add Your First Property
        </button>
      </div>
    </div>
  );
};