import React from 'react';
import { ChartBar as BarChart3, Plus } from 'lucide-react';

export const ComparisonPage: React.FC = () => {
  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Property Comparison</h2>
        <p className="text-gray-600 text-sm">Compare properties side by side</p>
      </div>

      {/* Empty State */}
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No comparisons yet</h3>
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">
          Add properties to your evaluation list first, then compare them here to make informed decisions.
        </p>
        <button className="btn-primary flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Start Comparing</span>
        </button>
      </div>
    </div>
  );
};