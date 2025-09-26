import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Settings } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/':
      case '/evaluation':
        return 'Property Evaluation';
      case '/comparison':
        return 'Property Comparison';
      case '/inspection':
        return 'Inspection Checklist';
      case '/mortgage':
        return 'Mortgage Calculator';
      case '/moving':
        return 'Moving Planner';
      case '/profile':
        return 'Profile';
      case '/login':
        return 'Sign In';
      case '/signup':
        return 'Sign Up';
      default:
        return 'Hausee Navigator';
    }
  };

  const showBackButton = () => {
    const path = location.pathname;
    return !['/evaluation', '/comparison', '/inspection', '/mortgage', '/moving'].includes(path);
  };

  const handleBackClick = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/evaluation');
    }
  };

  return (
    <header className="bg-white border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center space-x-3">
        {showBackButton() && (
          <button
            onClick={handleBackClick}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
        
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-coral-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {user && (
          <>
            <button
              onClick={() => navigate('/profile')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Profile"
            >
              <User className="w-5 h-5 text-gray-600" />
            </button>
            
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </>
        )}
      </div>
    </header>
  );
};