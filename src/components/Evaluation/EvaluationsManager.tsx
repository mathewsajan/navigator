import React, { useState } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import { Evaluation } from '../../types/evaluation';
import { useEvaluations } from '../../hooks/useEvaluations';
import { EvaluationsList } from './EvaluationsList';
import { EvaluationForm } from './EvaluationForm';
import LoadingSpinner from '../UI/LoadingSpinner';

interface EvaluationsManagerProps {
  propertyId: string;
  propertyAddress: string;
  onBack?: () => void;
}

type ViewMode = 'list' | 'form';

export const EvaluationsManager: React.FC<EvaluationsManagerProps> = ({
  propertyId,
  propertyAddress,
  onBack,
}) => {
  const {
    evaluations,
    currentEvaluation,
    loading,
    error,
    createEvaluation,
    deleteEvaluation,
    setCurrentEvaluation,
  } = useEvaluations(propertyId);

  const [viewMode, setViewMode] = useState<ViewMode>('list');

  /**
   * Handle creating new evaluation
   */
  const handleCreateEvaluation = async () => {
    const newEvaluation = await createEvaluation();
    if (newEvaluation) {
      setCurrentEvaluation(newEvaluation);
      setViewMode('form');
    }
  };

  /**
   * Handle viewing existing evaluation
   */
  const handleViewEvaluation = (evaluation: Evaluation) => {
    setCurrentEvaluation(evaluation);
    setViewMode('form');
  };

  /**
   * Handle deleting evaluation
   */
  const handleDeleteEvaluation = async (evaluation: Evaluation) => {
    if (window.confirm('Are you sure you want to delete this evaluation? This action cannot be undone.')) {
      await deleteEvaluation(evaluation.id);
    }
  };

  /**
   * Handle closing form
   */
  const handleCloseForm = () => {
    setCurrentEvaluation(null);
    setViewMode('list');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Evaluations</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {viewMode === 'list' ? (
        <>
          {/* Header */}
          <div className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  {onBack && (
                    <button
                      onClick={onBack}
                      className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Go back"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">Property Evaluations</h1>
                    <p className="text-sm text-gray-500">{propertyAddress}</p>
                  </div>
                </div>
                
                <button
                  onClick={handleCreateEvaluation}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Evaluation
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <EvaluationsList
              evaluations={evaluations}
              loading={loading}
              onView={handleViewEvaluation}
              onDelete={handleDeleteEvaluation}
            />
          </div>

          {/* Floating Action Button (Mobile) */}
          <button
            onClick={handleCreateEvaluation}
            className="fixed bottom-6 right-6 sm:hidden w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors z-40"
            aria-label="Create new evaluation"
          >
            <Plus className="w-6 h-6" />
          </button>
        </>
      ) : (
        <>
          {/* Form header */}
          <div className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center h-16">
                <button
                  onClick={handleCloseForm}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Back to evaluations list"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {currentEvaluation?.is_complete ? 'View' : 'Edit'} Evaluation
                  </h1>
                  <p className="text-sm text-gray-500">{propertyAddress}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {currentEvaluation ? (
              <EvaluationForm
                evaluation={currentEvaluation}
                propertyId={propertyId}
                onClose={handleCloseForm}
              />
            ) : (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" text="Loading evaluation..." />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};