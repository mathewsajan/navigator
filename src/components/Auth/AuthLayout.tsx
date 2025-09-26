import React from 'react';
import { Building2 } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

/**
 * Layout component for authentication pages
 * Provides consistent styling and branding for login, register, etc.
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and branding */}
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <div className="bg-primary-600 p-2 rounded-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Hausee Navigator</span>
          </div>
        </div>
        
        {/* Title and subtitle */}
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-center text-sm text-gray-600">
            {subtitle}
          </p>
        )}
      </div>

      {/* Main content area */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card px-4 py-8 shadow sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;