import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Layout } from '@/components/Layout/Layout';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';
import { Login } from '@/components/Auth/Login';
import { Signup } from '@/components/Auth/Signup';
import { Profile } from '@/components/Auth/Profile';
import { EvaluationPage } from '@/pages/EvaluationPage';
import { ComparisonPage } from '@/pages/ComparisonPage';
import { InspectionPage } from '@/pages/InspectionPage';
import { MortgagePage } from '@/pages/MortgagePage';
import { MovingPage } from '@/pages/MovingPage';
import { LoadingPage } from '@/components/UI/LoadingSpinner';
import { ErrorBoundary } from '@/components/UI/ErrorBoundary';

function App() {
  const { initialize, isInitialized } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Show loading screen while initializing
  if (!isInitialized) {
    return <LoadingPage text="Initializing Hausee Navigator..." />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes with Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Main Navigation Routes */}
            <Route index element={<Navigate to="/evaluation" replace />} />
            <Route path="evaluation" element={<EvaluationPage />} />
            <Route path="comparison" element={<ComparisonPage />} />
            <Route path="inspection" element={<InspectionPage />} />
            <Route path="mortgage" element={<MortgagePage />} />
            <Route path="moving" element={<MovingPage />} />
            
            {/* Profile Route */}
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/evaluation" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;