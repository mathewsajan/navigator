import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useRealtime } from './useRealtime';
import { generateInviteCode } from '@/lib/utils';
import type {
  Team,
  TeamMember,
  UserPresence,
  TeamActivity,
  TeamInviteResponse,
  JoinTeamResponse,
  TeamSettings,
  TeamRole,
  ActivityAction,
  ResourceType,
  UseTeamCollaborationReturn,
} from '@/types/team';

interface TeamCollaborationConfig {
  autoLoadActivities: boolean;
  activityLimit: number;
  presenceUpdateInterval: number;
}

const DEFAULT_CONFIG: TeamCollaborationConfig = {
  autoLoadActivities: true,
  activityLimit: 50,
  presenceUpdateInterval: 30000, // 30 seconds
};

/**
 * Custom hook for managing team collaboration features including:
 * - Real-time team member presence
 * - Team invitations and member management
 * - Activity tracking and notifications
 * - Collaborative editing support
 */
export const useTeamCollaboration = (
  teamId: string,
  config: Partial<TeamCollaborationConfig> = {}
): UseTeamCollaborationReturn => {
  const { user } = useAuthStore();
  const { subscribe, updatePresence, sendMessage, isConnected } = useRealtime();
  const configRef = useRef<TeamCollaborationConfig>({ ...DEFAULT_CONFIG, ...config });

  // State management
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [userPresence, setUserPresence] = useState<Record<string, UserPresence>>({});
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup and optimization
  const unsubscribeFunctionsRef = useRef<(() => void)[]>([]);
  const lastActivityTimestampRef = useRef<string>('');

  /**
   * Load team members with their profiles
   */
  const loadTeamMembers = useCallback(async () => {
    if (!teamId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('team_members')
        .select(`
          *,
          user_profile:user_profiles(*)
        `)
        .eq('team_id', teamId)
        .eq('is_active', true)
        .order('joined_at', { ascending: true });

      if (fetchError) throw fetchError;

      setTeamMembers(data || []);
    } catch (err) {
      console.error('Error loading team members:', err);
      setError(err instanceof Error ? err.message : 'Failed to load team members');
    }
  }, [teamId]);

  /**
   * Load recent team activities
   */
  const loadActivities = useCallback(async () => {
    if (!teamId || !configRef.current.autoLoadActivities) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('team_activities')
        .select(`
          *,
          user_profile:user_profiles(*)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(configRef.current.activityLimit);

      if (fetchError) throw fetchError;

      setActivities(data || []);
      
      if (data && data.length > 0) {
        lastActivityTimestampRef.current = data[0].created_at;
      }
    } catch (err) {
      console.error('Error loading activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    }
  }, [teamId]);

  /**
   * Generate and create team invite
   */
  const inviteTeamMember = useCallback(async (email?: string): Promise<TeamInviteResponse> => {
    if (!user || !teamId) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      // Check if user has permission to invite
      const { data: memberData } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single();

      if (!memberData || !['owner', 'admin'].includes(memberData.role)) {
        return { success: false, error: 'Insufficient permissions to invite members' };
      }

      // Generate secure invite code
      const inviteCode = generateInviteCode(8);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiration

      // Create invite record
      const { data: inviteData, error: inviteError } = await supabase
        .from('team_invites')
        .insert({
          team_id: teamId,
          invite_code: inviteCode,
          created_by: user.id,
          expires_at: expiresAt.toISOString(),
          max_uses: email ? 1 : 10, // Single use for email invites, multiple for general
          current_uses: 0,
          is_active: true,
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // If email provided, send invitation email (would integrate with email service)
      if (email) {
        // TODO: Integrate with email service
        console.log(`Sending invite to ${email} with code: ${inviteCode}`);
      }

      // Create invite URL
      const inviteUrl = `${window.location.origin}/join/${inviteCode}`;

      // Log activity
      await markActivity('member_invited', 'team', teamId, { 
        invite_code: inviteCode,
        email: email || null,
      });

      return {
        success: true,
        invite_code: inviteCode,
        invite_url: inviteUrl,
        expires_at: expiresAt.toISOString(),
      };
    } catch (err) {
      console.error('Error creating team invite:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create invite',
      };
    }
  }, [user, teamId]);

  /**
   * Join team using invite code
   */
  const joinTeam = useCallback(async (inviteCode: string): Promise<JoinTeamResponse> => {
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      // Validate invite code
      const { data: inviteData, error: inviteError } = await supabase
        .from('team_invites')
        .select(`
          *,
          team:teams(*)
        `)
        .eq('invite_code', inviteCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (inviteError || !inviteData) {
        return { success: false, error: 'Invalid or expired invite code' };
      }

      // Check if invite is expired
      if (new Date(inviteData.expires_at) < new Date()) {
        return { success: false, error: 'Invite code has expired' };
      }

      // Check if invite has reached max uses
      if (inviteData.max_uses && inviteData.current_uses >= inviteData.max_uses) {
        return { success: false, error: 'Invite code has reached maximum uses' };
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', inviteData.team_id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        return { success: false, error: 'You are already a member of this team' };
      }

      // Check team member limit
      const { count: memberCount } = await supabase
        .from('team_members')
        .select('*', { count: 'exact' })
        .eq('team_id', inviteData.team_id)
        .eq('is_active', true);

      if (memberCount && memberCount >= inviteData.team.max_members) {
        return { success: false, error: 'Team has reached maximum member limit' };
      }

      // Add user to team
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: inviteData.team_id,
          user_id: user.id,
          role: 'member',
          is_active: true,
        })
        .select(`
          *,
          user_profile:user_profiles(*)
        `)
        .single();

      if (memberError) throw memberError;

      // Update invite usage
      await supabase
        .from('team_invites')
        .update({ current_uses: inviteData.current_uses + 1 })
        .eq('id', inviteData.id);

      // Log activity
      await markActivity('member_joined', 'team', inviteData.team_id, {
        invite_code: inviteCode,
      });

      return {
        success: true,
        team: inviteData.team,
        member: memberData,
      };
    } catch (err) {
      console.error('Error joining team:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to join team',
      };
    }
  }, [user]);

  /**
   * Remove team member
   */
  const removeTeamMember = useCallback(async (memberId: string): Promise<boolean> => {
    if (!user || !teamId) return false;

    try {
      // Check permissions
      const { data: currentMember } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single();

      if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
        setError('Insufficient permissions to remove members');
        return false;
      }

      // Get member to remove
      const { data: memberToRemove } = await supabase
        .from('team_members')
        .select('user_id, role')
        .eq('id', memberId)
        .single();

      if (!memberToRemove) {
        setError('Member not found');
        return false;
      }

      // Prevent removing team owner
      if (memberToRemove.role === 'owner') {
        setError('Cannot remove team owner');
        return false;
      }

      // Remove member
      const { error: removeError } = await supabase
        .from('team_members')
        .update({ is_active: false })
        .eq('id', memberId);

      if (removeError) throw removeError;

      // Update local state
      setTeamMembers(prev => prev.filter(member => member.id !== memberId));

      // Log activity
      await markActivity('member_removed', 'member', memberId, {
        removed_user_id: memberToRemove.user_id,
      });

      return true;
    } catch (err) {
      console.error('Error removing team member:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove member');
      return false;
    }
  }, [user, teamId]);

  /**
   * Update team member role
   */
  const updateMemberRole = useCallback(async (memberId: string, role: TeamRole): Promise<boolean> => {
    if (!user || !teamId) return false;

    try {
      // Check permissions
      const { data: currentMember } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single();

      if (!currentMember || currentMember.role !== 'owner') {
        setError('Only team owners can change member roles');
        return false;
      }

      // Update member role
      const { error: updateError } = await supabase
        .from('team_members')
        .update({ role })
        .eq('id', memberId);

      if (updateError) throw updateError;

      // Update local state
      setTeamMembers(prev =>
        prev.map(member =>
          member.id === memberId ? { ...member, role } : member
        )
      );

      // Log activity
      await markActivity('member_role_updated', 'member', memberId, {
        new_role: role,
      });

      return true;
    } catch (err) {
      console.error('Error updating member role:', err);
      setError(err instanceof Error ? err.message : 'Failed to update member role');
      return false;
    }
  }, [user, teamId]);

  /**
   * Update team settings
   */
  const updateTeamSettings = useCallback(async (settings: Partial<TeamSettings>): Promise<boolean> => {
    if (!user || !teamId) return false;

    try {
      // Check permissions
      const { data: currentMember } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single();

      if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
        setError('Insufficient permissions to update team settings');
        return false;
      }

      // Update team settings
      const { error: updateError } = await supabase
        .from('teams')
        .update({ settings })
        .eq('id', teamId);

      if (updateError) throw updateError;

      // Log activity
      await markActivity('team_settings_updated', 'team', teamId, {
        updated_settings: Object.keys(settings),
      });

      return true;
    } catch (err) {
      console.error('Error updating team settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update team settings');
      return false;
    }
  }, [user, teamId]);

  /**
   * Mark team activity
   */
  const markActivity = useCallback(async (
    action: ActivityAction,
    resourceType: ResourceType,
    resourceId: string,
    metadata: Record<string, any> = {}
  ) => {
    if (!user || !teamId) return;

    try {
      const { error } = await supabase
        .from('team_activities')
        .insert({
          team_id: teamId,
          user_id: user.id,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          metadata,
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error marking activity:', err);
    }
  }, [user, teamId]);

  /**
   * Handle real-time presence updates
   */
  const handlePresenceUpdate = useCallback((payload: any) => {
    if (payload.type === 'presence') {
      const presenceState = payload.payload;
      const updatedPresence: Record<string, UserPresence> = {};

      Object.entries(presenceState).forEach(([userId, presences]: [string, any]) => {
        if (Array.isArray(presences) && presences.length > 0) {
          updatedPresence[userId] = presences[0];
        }
      });

      setUserPresence(updatedPresence);
    }
  }, []);

  /**
   * Handle real-time team member updates
   */
  const handleTeamMemberUpdate = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        if (newRecord.team_id === teamId) {
          loadTeamMembers(); // Reload to get user profile
        }
        break;
      case 'UPDATE':
        if (newRecord.team_id === teamId) {
          setTeamMembers(prev =>
            prev.map(member =>
              member.id === newRecord.id ? { ...member, ...newRecord } : member
            )
          );
        }
        break;
      case 'DELETE':
        setTeamMembers(prev => prev.filter(member => member.id !== oldRecord.id));
        break;
    }
  }, [teamId, loadTeamMembers]);

  /**
   * Handle real-time activity updates
   */
  const handleActivityUpdate = useCallback((payload: any) => {
    const { eventType, new: newRecord } = payload;

    if (eventType === 'INSERT' && newRecord.team_id === teamId) {
      setActivities(prev => [newRecord, ...prev.slice(0, configRef.current.activityLimit - 1)]);
    }
  }, [teamId]);

  /**
   * Initialize real-time subscriptions
   */
  useEffect(() => {
    if (!teamId || !isConnected) return;

    // Clear previous subscriptions
    unsubscribeFunctionsRef.current.forEach(unsubscribe => unsubscribe());
    unsubscribeFunctionsRef.current = [];

    // Subscribe to team presence
    const unsubscribePresence = subscribe(`team_presence_${teamId}`, handlePresenceUpdate);
    unsubscribeFunctionsRef.current.push(unsubscribePresence);

    // Subscribe to team member changes
    const unsubscribeMembers = subscribe(`team_members_${teamId}`, handleTeamMemberUpdate);
    unsubscribeFunctionsRef.current.push(unsubscribeMembers);

    // Subscribe to team activities
    if (configRef.current.autoLoadActivities) {
      const unsubscribeActivities = subscribe(`team_activities_${teamId}`, handleActivityUpdate);
      unsubscribeFunctionsRef.current.push(unsubscribeActivities);
    }

    // Update presence for this team
    if (user) {
      updatePresence({
        team_id: teamId,
        status: 'online',
        current_page: window.location.pathname,
      });
    }

    return () => {
      unsubscribeFunctionsRef.current.forEach(unsubscribe => unsubscribe());
    };
  }, [teamId, isConnected, user, subscribe, updatePresence, handlePresenceUpdate, handleTeamMemberUpdate, handleActivityUpdate]);

  /**
   * Load initial data
   */
  useEffect(() => {
    if (!teamId) return;

    const loadInitialData = async () => {
      setLoading(true);
      setError(null);

      try {
        await Promise.all([
          loadTeamMembers(),
          loadActivities(),
        ]);
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load team data');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [teamId, loadTeamMembers, loadActivities]);

  return {
    teamMembers,
    userPresence,
    activities,
    loading,
    error,
    inviteTeamMember,
    joinTeam,
    removeTeamMember,
    updateMemberRole,
    updateTeamSettings,
    markActivity,
  };
};