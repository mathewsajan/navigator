import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for database tables
export interface User {
  id: string;
  email: string;
  full_name: string;
  team_invite_code: string;
  team_id: string | null;
  role: 'primary' | 'collaborator';
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  team_id: string;
  address: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  lot_size: number;
  year_built: number;
  listing_price: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Evaluation {
  id: string;
  property_id: string;
  team_id: string;
  estimated_value: number;
  confidence_score: number;
  evaluation_notes: string;
  evaluation_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MediaFile {
  id: string;
  property_id: string;
  team_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  uploaded_by: string;
  created_at: string;
}

// Authentication helper functions
export const authHelpers = {
  /**
   * Sign up a new user with email and password
   */
  async signUp(email: string, password: string, fullName: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      // Update the user profile with full name
      if (data.user) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ full_name: fullName })
          .eq('id', data.user.id);

        if (updateError) {
          console.error('Error updating user profile:', updateError);
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  },

  /**
   * Reset password for a user
   */
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Password reset error:', error);
      return { error };
    }
  },

  /**
   * Update user password
   */
  async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Password update error:', error);
      return { error };
    }
  },

  /**
   * Get current user session
   */
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { session, error: null };
    } catch (error) {
      console.error('Get session error:', error);
      return { session: null, error };
    }
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { user, error: null };
    } catch (error) {
      console.error('Get user error:', error);
      return { user: null, error };
    }
  },
};

// Team management helper functions
export const teamHelpers = {
  /**
   * Create a new team for the current user
   */
  async createTeam(name: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create the team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name,
          created_by: user.id,
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Update user to be part of this team as primary
      const { error: userError } = await supabase
        .from('users')
        .update({
          team_id: team.id,
          role: 'primary',
        })
        .eq('id', user.id);

      if (userError) throw userError;

      return { team, error: null };
    } catch (error) {
      console.error('Create team error:', error);
      return { team: null, error };
    }
  },

  /**
   * Join a team using an invite code
   */
  async joinTeam(inviteCode: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Find the user with this invite code
      const { data: invitingUser, error: findError } = await supabase
        .from('users')
        .select('team_id')
        .eq('team_invite_code', inviteCode.toUpperCase())
        .single();

      if (findError || !invitingUser?.team_id) {
        throw new Error('Invalid invite code');
      }

      // Update current user to join the team as collaborator
      const { error: updateError } = await supabase
        .from('users')
        .update({
          team_id: invitingUser.team_id,
          role: 'collaborator',
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      return { error: null };
    } catch (error) {
      console.error('Join team error:', error);
      return { error };
    }
  },

  /**
   * Get current user's team information
   */
  async getCurrentTeam() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          teams (*)
        `)
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      return { team: userProfile.teams, userProfile, error: null };
    } catch (error) {
      console.error('Get current team error:', error);
      return { team: null, userProfile: null, error };
    }
  },

  /**
   * Get team members
   */
  async getTeamMembers(teamId: string) {
    try {
      const { data: members, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, team_invite_code, created_at')
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return { members, error: null };
    } catch (error) {
      console.error('Get team members error:', error);
      return { members: null, error };
    }
  },

  /**
   * Leave current team
   */
  async leaveTeam() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('users')
        .update({
          team_id: null,
          role: 'primary',
        })
        .eq('id', user.id);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Leave team error:', error);
      return { error };
    }
  },
};

// User profile helper functions
export const userHelpers = {
  /**
   * Get current user profile
   */
  async getCurrentUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      return { profile, error: null };
    } catch (error) {
      console.error('Get user profile error:', error);
      return { profile: null, error };
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<Pick<User, 'full_name'>>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      return { profile: data, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { profile: null, error };
    }
  },
};

// Property management helper functions
export const propertyHelpers = {
  /**
   * Create a new property
   */
  async createProperty(propertyData: Omit<Property, 'id' | 'created_by' | 'created_at' | 'updated_at'>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('properties')
        .insert({
          ...propertyData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      return { property: data, error: null };
    } catch (error) {
      console.error('Create property error:', error);
      return { property: null, error };
    }
  },

  /**
   * Get team properties
   */
  async getTeamProperties(teamId: string) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { properties: data, error: null };
    } catch (error) {
      console.error('Get team properties error:', error);
      return { properties: null, error };
    }
  },

  /**
   * Update property
   */
  async updateProperty(propertyId: string, updates: Partial<Property>) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', propertyId)
        .select()
        .single();

      if (error) throw error;

      return { property: data, error: null };
    } catch (error) {
      console.error('Update property error:', error);
      return { property: null, error };
    }
  },

  /**
   * Delete property
   */
  async deleteProperty(propertyId: string) {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Delete property error:', error);
      return { error };
    }
  },
};

// Real-time subscriptions helper
export const subscriptionHelpers = {
  /**
   * Subscribe to team data changes
   */
  subscribeToTeamChanges(teamId: string, callback: (payload: any) => void) {
    const subscription = supabase
      .channel(`team-${teamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'properties',
          filter: `team_id=eq.${teamId}`,
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evaluations',
          filter: `team_id=eq.${teamId}`,
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `team_id=eq.${teamId}`,
        },
        callback
      )
      .subscribe();

    return subscription;
  },

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(subscription: any) {
    supabase.removeChannel(subscription);
  },
};