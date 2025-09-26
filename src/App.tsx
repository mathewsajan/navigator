import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm, RegisterForm, ForgotPasswordForm, AuthGuard } from './components/Auth';
import TeamSetup from './components/Team/TeamSetup';
import Dashboard from './components/Dashboard/Dashboard';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Auth flow component that handles different authentication states
const AuthFlow: React.FC = () => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot-password'>('login');

  const renderAuthForm = () => {
    switch (authMode) {
      case 'register':
        return (
          <RegisterForm 
            onSwitchToLogin={() => setAuthMode('login')} 
          />
        );
      case 'forgot-password':
        return (
          <ForgotPasswordForm 
            onSwitchToLogin={() => setAuthMode('login')} 
          />
        );
      default:
        return (
          <LoginForm 
            onSwitchToRegister={() => setAuthMode('register')}
            onSwitchToForgotPassword={() => setAuthMode('forgot-password')}
          />
        );
    }
  };

  return renderAuthForm();
};

// Main app content component
const AppContent: React.FC = () => {
  const { user, userProfile, team, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading Hausee Navigator..." />
      </div>
    );
  }

  // User is not authenticated - show auth forms
  if (!user) {
    return <AuthFlow />;
  }

  // User is authenticated but doesn't have a team - show team setup
  if (!team) {
    return <TeamSetup />;
  }

  // User is authenticated and has a team - show dashboard
  return <Dashboard />;
};

// Root App component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  );
};

export default App;