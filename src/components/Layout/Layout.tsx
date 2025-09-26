import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { ErrorBoundary } from '../UI/ErrorBoundary';

interface LayoutProps {
  showNavigation?: boolean;
  showHeader?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ 
  showNavigation = true, 
  showHeader = true 
}) => {
  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      {showHeader && <Header />}
      
      <main className={`flex-1 ${showNavigation ? 'pb-20' : ''}`}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      
      {showNavigation && <BottomNavigation />}
    </div>
  );
};