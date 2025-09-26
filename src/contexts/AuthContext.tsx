import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, authHelpers, teamHelpers, userHelpers, User, Team } from '../lib/supabase';

// Define the shape of our auth context
interface AuthContextType {
  // Authentication state
  user: SupabaseUser | null;
  session: Session | null;
  userProfile: User | null;
  team: Team | null;
  loading: boolean;
  
  // Authentication methods
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  
  // Team management methods
  createTeam: (name: string) => Promise<{ error: any }>;
  joinTeam: (inviteCode: string) => Promise<{ error: any }>;
  leaveTeam: () => Promise<{ error: any }>;
  refreshTeamData: () => Promise<void>;
  
  // Profile management
  updateProfile: (updates: Partial<Pick<User, 'full_name'>>) => Promise<{ error: any }>;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider component that wraps the app and provides auth state
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // State management for authentication and user data
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Load user profile and team data
   */
  const loadUserData = async (currentUser: SupabaseUser) => {
    try {
      // Load user profile
      const { profile, error: profileError } = await userHelpers.getCurrentUserProfile();
      if (profileError) {
        console.error('Error loading user profile:', profileError);
        return;
      }

      setUserProfile(profile);

      // Load team data if user is part of a team
      if (profile?.team_id) {
        const { team: teamData, error: teamError } = await teamHelpers.getCurrentTeam();
        if (teamError) {
          console.error('Error loading team data:', teamError);
          return;
        }

        setTeam(teamData);
      } else {
        setTeam(null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  /**
   * Refresh team data (useful after team operations)
   */
  const refreshTeamData = async () => {
    if (!user) return;

    try {
      const { team: teamData, userProfile: updatedProfile, error } = await teamHelpers.getCurrentTeam();
      if (error) {
        console.error('Error refreshing team data:', error);
        return;
      }

      setUserProfile(updatedProfile);
      setTeam(teamData);
    } catch (error) {
      console.error('Error refreshing team data:', error);
    }
  };

  /**
   * Initialize auth state and set up auth listener
   */
  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          return;
        }

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);

          if (initialSession?.user) {
            await loadUserData(initialSession.user);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, session?.user?.email);

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // User signed in, load their data
          await loadUserData(session.user);
        } else {
          // User signed out, clear data
          setUserProfile(null);
          setTeam(null);
        }

        setLoading(false);
      }
    );

    // Cleanup function
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign up a new user
   */
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      const { error } = await authHelpers.signUp(email, password, fullName);
      return { error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign in an existing user
   */
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await authHelpers.signIn(email, password);
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await authHelpers.signOut();
      
      // Clear local state immediately
      setUser(null);
      setSession(null);
      setUserProfile(null);
      setTeam(null);
      
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset user password
   */
  const resetPassword = async (email: string) => {
    try {
      const { error } = await authHelpers.resetPassword(email);
      return { error };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error };
    }
  };

  /**
   * Update user password
   */
  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await authHelpers.updatePassword(newPassword);
      return { error };
    } catch (error) {
      console.error('Update password error:', error);
      return { error };
    }
  };

  /**
   * Create a new team
   */
  const createTeam = async (name: string) => {
    try {
      setLoading(true);
      const { error } = await teamHelpers.createTeam(name);
      
      if (!error) {
        // Refresh user and team data
        await refreshTeamData();
      }
      
      return { error };
    } catch (error) {
      console.error('Create team error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Join an existing team
   */
  const joinTeam = async (inviteCode: string) => {
    try {
      setLoading(true);
      const { error } = await teamHelpers.joinTeam(inviteCode);
      
      if (!error) {
        // Refresh user and team data
        await refreshTeamData();
      }
      
      return { error };
    } catch (error) {
      console.error('Join team error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Leave the current team
   */
  const leaveTeam = async () => {
    try {
      setLoading(true);
      const { error } = await teamHelpers.leaveTeam();
      
      if (!error) {
        // Clear team data and refresh user profile
        setTeam(null);
        await refreshTeamData();
      }
      
      return { error };
    } catch (error) {
      console.error('Leave team error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (updates: Partial<Pick<User, 'full_name'>>) => {
    try {
      const { profile, error } = await userHelpers.updateProfile(updates);
      
      if (!error && profile) {
        setUserProfile(profile);
      }
      
      return { error };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error };
    }
  };

  // Context value object
  const value: AuthContextType = {
    // State
    user,
    session,
    userProfile,
    team,
    loading,
    
    // Authentication methods
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    
    // Team management methods
    createTeam,
    joinTeam,
    leaveTeam,
    refreshTeamData,
    
    // Profile management
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;