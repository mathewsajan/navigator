import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Clock, Bell, LogOut, Save } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import type { ProfileFormData } from '@/types';

const profileSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters'),
  timezone: z.string().min(1, 'Timezone is required'),
  notificationPreferences: z.object({
    email: z.boolean(),
    push: z.boolean(),
    realtime: z.boolean(),
  }),
});

const timezones = [
  { value: 'America/Toronto', label: 'Eastern Time (Toronto)' },
  { value: 'America/Winnipeg', label: 'Central Time (Winnipeg)' },
  { value: 'America/Edmonton', label: 'Mountain Time (Edmonton)' },
  { value: 'America/Vancouver', label: 'Pacific Time (Vancouver)' },
  { value: 'America/St_Johns', label: 'Newfoundland Time (St. Johns)' },
  { value: 'America/Halifax', label: 'Atlantic Time (Halifax)' },
];

export const Profile: React.FC = () => {
  const { user, updateProfile, logout, isLoading, error, clearError } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.profile?.full_name || '',
      timezone: user?.profile?.timezone || 'America/Toronto',
      notificationPreferences: {
        email: user?.profile?.notification_preferences?.email ?? true,
        push: user?.profile?.notification_preferences?.push ?? true,
        realtime: user?.profile?.notification_preferences?.realtime ?? true,
      },
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsSaving(true);
      clearError();
      
      await updateProfile({
        full_name: data.fullName,
        timezone: data.timezone,
        notification_preferences: data.notificationPreferences,
      });
      
      setIsEditing(false);
      reset(data);
    } catch (error) {
      // Error is handled by the store
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
    clearError();
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await logout();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-coral-500 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {user.profile?.full_name || 'User Profile'}
              </h1>
              <p className="text-gray-600 flex items-center space-x-1">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                {...register('fullName')}
                type="text"
                id="fullName"
                disabled={!isEditing}
                className={`input ${!isEditing ? 'bg-gray-50' : ''} ${errors.fullName ? 'border-red-300' : ''}`}
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <p className="error-text">{errors.fullName.message}</p>
              )}
            </div>

            {/* Timezone */}
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Timezone
              </label>
              <select
                {...register('timezone')}
                id="timezone"
                disabled={!isEditing}
                className={`input ${!isEditing ? 'bg-gray-50' : ''} ${errors.timezone ? 'border-red-300' : ''}`}
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              {errors.timezone && (
                <p className="error-text">{errors.timezone.message}</p>
              )}
            </div>

            {/* Notification Preferences */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Bell className="w-4 h-4 inline mr-1" />
                Notification Preferences
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    {...register('notificationPreferences.email')}
                    type="checkbox"
                    disabled={!isEditing}
                    className="rounded border-gray-300 text-coral-500 focus:ring-coral-500 disabled:opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Email notifications</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    {...register('notificationPreferences.push')}
                    type="checkbox"
                    disabled={!isEditing}
                    className="rounded border-gray-300 text-coral-500 focus:ring-coral-500 disabled:opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Push notifications</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    {...register('notificationPreferences.realtime')}
                    type="checkbox"
                    disabled={!isEditing}
                    className="rounded border-gray-300 text-coral-500 focus:ring-coral-500 disabled:opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Real-time updates</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={!isDirty || isSaving}
                  className="btn-primary flex items-center space-x-2"
                >
                  {isSaving ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h3>
          <div className="space-y-3">
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};