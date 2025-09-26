import React, { useState } from 'react';
import { Eye, EyeOff, Loader as Loader2, Check, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from './AuthLayout';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

/**
 * Registration form component with validation and password strength indicator
 * Creates new user accounts with email/password authentication
 */
const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { signUp } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Handle form input changes
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  /**
   * Password strength validation
   */
  const getPasswordStrength = (password: string) => {
    const requirements = [
      { test: password.length >= 8, label: 'At least 8 characters' },
      { test: /[A-Z]/.test(password), label: 'One uppercase letter' },
      { test: /[a-z]/.test(password), label: 'One lowercase letter' },
      { test: /\d/.test(password), label: 'One number' },
      { test: /[!@#$%^&*(),.?":{}|<>]/.test(password), label: 'One special character' },
    ];

    return requirements;
  };

  /**
   * Validate form data
   */
  const validateForm = (): string | null => {
    if (!formData.fullName.trim()) {
      return 'Full name is required';
    }
    
    if (formData.fullName.trim().length < 2) {
      return 'Full name must be at least 2 characters long';
    }
    
    if (!formData.email.trim()) {
      return 'Email is required';
    }
    
    if (!formData.email.includes('@')) {
      return 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      return 'Password is required';
    }
    
    const passwordRequirements = getPasswordStrength(formData.password);
    const unmetRequirements = passwordRequirements.filter(req => !req.test);
    
    if (unmetRequirements.length > 0) {
      return `Password must meet all requirements: ${unmetRequirements.map(req => req.label).join(', ')}`;
    }
    
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    
    return null;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: signUpError } = await signUp(
        formData.email.trim(),
        formData.password,
        formData.fullName.trim()
      );
      
      if (signUpError) {
        // Handle specific error types
        if (signUpError.message?.includes('User already registered')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else if (signUpError.message?.includes('Password should be at least')) {
          setError('Password does not meet the minimum requirements.');
        } else {
          setError(signUpError.message || 'An error occurred during registration. Please try again.');
        }
      } else {
        setSuccess(true);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show success message after registration
  if (success) {
    return (
      <AuthLayout 
        title="Check your email"
        subtitle="We've sent you a confirmation link"
      >
        <div className="text-center space-y-4">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            <p className="text-sm">
              Please check your email and click the confirmation link to activate your account.
            </p>
          </div>
          
          <button
            onClick={onSwitchToLogin}
            className="btn-primary w-full"
          >
            Back to Sign In
          </button>
        </div>
      </AuthLayout>
    );
  }

  const passwordRequirements = getPasswordStrength(formData.password);

  return (
    <AuthLayout 
      title="Create your account"
      subtitle="Start evaluating properties with your team"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Full name field */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
            Full name
          </label>
          <div className="mt-1">
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              className="input"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>
        </div>

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
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>
        </div>

        {/* Password field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="mt-1 relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              className="input pr-10"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={loading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          
          {/* Password requirements */}
          {formData.password && (
            <div className="mt-2 space-y-1">
              {passwordRequirements.map((requirement, index) => (
                <div key={index} className="flex items-center text-xs">
                  {requirement.test ? (
                    <Check className="h-3 w-3 text-green-500 mr-2" />
                  ) : (
                    <X className="h-3 w-3 text-red-500 mr-2" />
                  )}
                  <span className={requirement.test ? 'text-green-700' : 'text-red-700'}>
                    {requirement.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirm password field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm password
          </label>
          <div className="mt-1 relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              className="input pr-10"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              disabled={loading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          
          {/* Password match indicator */}
          {formData.confirmPassword && (
            <div className="mt-1 flex items-center text-xs">
              {formData.password === formData.confirmPassword ? (
                <>
                  <Check className="h-3 w-3 text-green-500 mr-2" />
                  <span className="text-green-700">Passwords match</span>
                </>
              ) : (
                <>
                  <X className="h-3 w-3 text-red-500 mr-2" />
                  <span className="text-red-700">Passwords do not match</span>
                </>
              )}
            </div>
          )}
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
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </button>
        </div>

        {/* Switch to login */}
        <div className="text-center">
          <span className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              disabled={loading}
            >
              Sign in
            </button>
          </span>
        </div>
      </form>
    </AuthLayout>
  );
};

export default RegisterForm;