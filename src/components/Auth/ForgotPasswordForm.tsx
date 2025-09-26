import React, { useState } from 'react';
import { Loader as Loader2, ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from './AuthLayout';

interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void;
}

/**
 * Forgot password form component
 * Allows users to request a password reset email
 */
const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSwitchToLogin }) => {
  const { resetPassword } = useAuth();
  
  // Form state
  const [email, setEmail] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Handle email input change
   */
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  /**
   * Validate email
   */
  const validateEmail = (): string | null => {
    if (!email.trim()) {
      return 'Email is required';
    }
    
    if (!email.includes('@')) {
      return 'Please enter a valid email address';
    }
    
    return null;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    const validationError = validateEmail();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await resetPassword(email.trim());
      
      if (resetError) {
        // Handle specific error types
        if (resetError.message?.includes('User not found')) {
          setError('No account found with this email address.');
        } else {
          setError(resetError.message || 'An error occurred while sending the reset email. Please try again.');
        }
      } else {
        setSuccess(true);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show success message after sending reset email
  if (success) {
    return (
      <AuthLayout 
        title="Check your email"
        subtitle="We've sent you a password reset link"
      >
        <div className="text-center space-y-6">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            <div className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              <div className="text-left">
                <p className="text-sm font-medium">Reset link sent!</p>
                <p className="text-sm mt-1">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 space-y-2">
            <p>Click the link in the email to reset your password.</p>
            <p>If you don't see the email, check your spam folder.</p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setSuccess(false);
                setEmail('');
              }}
              className="btn-secondary w-full"
            >
              Send another email
            </button>
            
            <button
              onClick={onSwitchToLogin}
              className="btn-primary w-full"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Email field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="input"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
              disabled={loading}
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            We'll send a password reset link to this email address.
          </p>
        </div>

        {/* Submit button */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-10 px-4 py-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Sending reset link...
              </>
            ) : (
              'Send reset link'
            )}
          </button>
        </div>

        {/* Back to login */}
        <div className="text-center">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
            disabled={loading}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Sign In
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ForgotPasswordForm;