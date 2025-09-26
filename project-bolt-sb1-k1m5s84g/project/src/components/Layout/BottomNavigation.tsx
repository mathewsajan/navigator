import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ClipboardCheck, ChartBar as BarChart3, Search, Calculator, Truck } from 'lucide-react';
import type { NavTab } from '@/types';

const navigationTabs: NavTab[] = [
  {
    id: 'evaluation',
    label: 'Evaluation',
    icon: ClipboardCheck,
    path: '/evaluation',
  },
  {
    id: 'comparison',
    label: 'Comparison',
    icon: BarChart3,
    path: '/comparison',
  },
  {
    id: 'inspection',
    label: 'Inspection',
    icon: Search,
    path: '/inspection',
  },
  {
    id: 'mortgage',
    label: 'Mortgage',
    icon: Calculator,
    path: '/mortgage',
  },
  {
    id: 'moving',
    label: 'Moving',
    icon: Truck,
    path: '/moving',
  },
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isTabActive = (path: string) => {
    return location.pathname === path || 
           (path === '/evaluation' && location.pathname === '/');
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-border safe-area-bottom"
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navigationTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = isTabActive(tab.path);
          
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`nav-tab ${isActive ? 'active' : ''}`}
              role="tab"
              aria-selected={isActive}
              aria-label={`Navigate to ${tab.label}`}
            >
              <Icon className={`nav-tab-icon ${isActive ? 'text-coral-500' : 'text-gray-400'}`} />
              <span className={isActive ? 'text-coral-500' : 'text-gray-400'}>
                {tab.label}
              </span>
              {tab.badge && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-coral-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};