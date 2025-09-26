import type { Database } from './supabase';

// Database types
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type Team = Database['public']['Tables']['teams']['Row'];
export type TeamMember = Database['public']['Tables']['team_members']['Row'];
export type Property = Database['public']['Tables']['properties']['Row'];

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  profile?: UserProfile;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

export interface ProfileFormData {
  fullName: string;
  timezone: string;
  notificationPreferences: {
    email: boolean;
    push: boolean;
    realtime: boolean;
  };
}

// Navigation types
export interface NavTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
}

// UI types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

// Property types
export interface PropertyFormData {
  address: string;
  city: string;
  province: string;
  postalCode: string;
  listingPrice?: number;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  lotSizeSquareFeet?: number;
  yearBuilt?: number;
  mlsNumber?: string;
  listingUrl?: string;
  notes?: string;
  visitDate?: string;
}

// Team types
export interface TeamFormData {
  name: string;
  description?: string;
}

export interface JoinTeamFormData {
  inviteCode: string;
}

// Error types
export interface FormError {
  field: string;
  message: string;
}

export interface AppError {
  message: string;
  code?: string;
  details?: any;
}

// PWA types
export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;