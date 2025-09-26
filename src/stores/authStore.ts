import { create } from 'zustand';
import { supabase, handleSupabaseError } from '@/lib/supabase';
import type { AuthUser, LoginFormData, SignupFormData } from '@/types';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

interface AuthActions {
  initialize: () => Promise<void>;
  login: (data: LoginFormData) => Promise<void>;
  signup: (data: SignupFormData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateProfile: (updates: Partial<AuthUser['profile']>) => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  isLoading: false,
  error: null,
  isInitialized: false,

  // Initialize auth state
  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }

      if (session?.user) {
        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
        }

        set({
          user: {
            id: session.user.id,
            email: session.user.email!,
            profile: profile || undefined,
          },
          isLoading: false,
          isInitialized: true,
        });
      } else {
        set({ user: null, isLoading: false, isInitialized: true });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          set({
            user: {
              id: session.user.id,
              email: session.user.email!,
              profile: profile || undefined,
            },
            error: null,
          });
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, error: null });
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ 
        error: handleSupabaseError(error), 
        isLoading: false, 
        isInitialized: true 
      });
    }
  },

  // Login user
  login: async (data: LoginFormData) => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: handleSupabaseError(error), 
        isLoading: false 
      });
      throw error;
    }
  },

  // Sign up user
  signup: async (data: SignupFormData) => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (error) {
        throw error;
      }

      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: handleSupabaseError(error), 
        isLoading: false 
      });
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      set({ user: null, isLoading: false });
    } catch (error) {
      set({ 
        error: handleSupabaseError(error), 
        isLoading: false 
      });
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Update user profile
  updateProfile: async (updates) => {
    try {
      const { user } = get();
      if (!user) throw new Error('No authenticated user');

      set({ isLoading: true, error: null });

      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // Update local state
      set({
        user: {
          ...user,
          profile: user.profile ? { ...user.profile, ...updates } : undefined,
        },
        isLoading: false,
      });
    } catch (error) {
      set({ 
        error: handleSupabaseError(error), 
        isLoading: false 
      });
      throw error;
    }
  },
}));