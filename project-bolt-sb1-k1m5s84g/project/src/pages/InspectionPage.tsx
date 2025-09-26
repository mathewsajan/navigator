import React from 'react';
import { Search, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react';

export const InspectionPage: React.FC = () => {
  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Inspection Checklist</h2>
        <p className="text-gray-600 text-sm">Track inspection items and findings</p>
      </div>

      {/* Empty State */}
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No inspections scheduled</h3>
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">
          Create inspection checklists for your properties to ensure nothing is missed during viewings.
        </p>
        <button className="btn-primary">
          Create Inspection Checklist
        </button>
      </div>

      {/* Sample Checklist Items (for demonstration) */}
      <div className="space-y-3 mt-8">
        <h3 className="font-medium text-gray-900">Sample Inspection Items</h3>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-gray-900">Electrical system inspection</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <span className="text-gray-900">Plumbing system check</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
            <span className="text-gray-900">HVAC system evaluation</span>
          </div>
        </div>
      </div>
    </div>
  );
};