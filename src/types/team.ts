export interface Team {
  id: string;
  name: string;
  description?: string;
  invite_code: string;
  invite_expires_at: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  max_members: number;
  is_active: boolean;
  settings: TeamSettings;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  is_active: boolean;
  last_seen_at: string;
  presence_status: PresenceStatus;
  user_profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  timezone: string;
}

export interface TeamSettings {
  notifications: {
    email: boolean;
    push: boolean;
    realtime: boolean;
  };
  permissions: {
    invite_members: TeamRole[];
    manage_properties: TeamRole[];
    delete_evaluations: TeamRole[];
  };
  collaboration: {
    show_cursors: boolean;
    auto_save_interval: number;
    conflict_resolution: 'last_write_wins' | 'operational_transform';
  };
}

export interface TeamInvite {
  id: string;
  team_id: string;
  invite_code: string;
  created_by: string;
  expires_at: string;
  max_uses?: number;
  current_uses: number;
  is_active: boolean;
  created_at: string;
}

export interface TeamActivity {
  id: string;
  team_id: string;
  user_id: string;
  action: ActivityAction;
  resource_type: ResourceType;
  resource_id: string;
  metadata: Record<string, any>;
  created_at: string;
  user_profile?: UserProfile;
}

export interface UserPresence {
  user_id: string;
  team_id: string;
  status: PresenceStatus;
  last_seen: string;
  current_page?: string;
  cursor_position?: CursorPosition;
  selection?: TextSelection;
  metadata?: Record<string, any>;
}

export interface CursorPosition {
  x: number;
  y: number;
  element_id?: string;
}

export interface TextSelection {
  start: number;
  end: number;
  element_id: string;
  text: string;
}

export interface RealtimeConnection {
  id: string;
  status: ConnectionStatus;
  last_ping: string;
  reconnect_attempts: number;
  subscriptions: string[];
}

export interface CollaborativeEdit {
  id: string;
  resource_type: ResourceType;
  resource_id: string;
  user_id: string;
  operation: EditOperation;
  timestamp: string;
  applied: boolean;
  conflicts?: string[];
}

export interface EditOperation {
  type: 'insert' | 'delete' | 'replace' | 'move';
  position: number;
  content?: string;
  length?: number;
  metadata?: Record<string, any>;
}

export interface NotificationPreference {
  user_id: string;
  team_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  realtime_notifications: boolean;
  activity_types: ActivityAction[];
  quiet_hours?: {
    start: string;
    end: string;
    timezone: string;
  };
}

// Enums
export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';
export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';
export type ActivityAction = 
  | 'member_joined' 
  | 'member_left' 
  | 'property_created' 
  | 'property_updated' 
  | 'property_deleted'
  | 'evaluation_created' 
  | 'evaluation_updated' 
  | 'evaluation_completed'
  | 'media_uploaded'
  | 'team_settings_updated';
export type ResourceType = 'property' | 'evaluation' | 'media' | 'team' | 'member';

// API Response Types
export interface TeamInviteResponse {
  success: boolean;
  invite_code?: string;
  invite_url?: string;
  expires_at?: string;
  error?: string;
}

export interface JoinTeamResponse {
  success: boolean;
  team?: Team;
  member?: TeamMember;
  error?: string;
}

export interface PresenceUpdate {
  user_id: string;
  status: PresenceStatus;
  metadata?: Record<string, any>;
  timestamp: string;
}

// Hook Return Types
export interface UseRealtimeReturn {
  connection: RealtimeConnection;
  subscribe: (channel: string, callback: (payload: any) => void) => () => void;
  unsubscribe: (channel: string) => void;
  updatePresence: (presence: Partial<UserPresence>) => void;
  sendMessage: (channel: string, event: string, payload: any) => void;
  isConnected: boolean;
  reconnect: () => void;
}

export interface UseTeamCollaborationReturn {
  teamMembers: TeamMember[];
  userPresence: Record<string, UserPresence>;
  activities: TeamActivity[];
  loading: boolean;
  error: string | null;
  inviteTeamMember: (email?: string) => Promise<TeamInviteResponse>;
  joinTeam: (inviteCode: string) => Promise<JoinTeamResponse>;
  removeTeamMember: (memberId: string) => Promise<boolean>;
  updateMemberRole: (memberId: string, role: TeamRole) => Promise<boolean>;
  updateTeamSettings: (settings: Partial<TeamSettings>) => Promise<boolean>;
  markActivity: (action: ActivityAction, resourceType: ResourceType, resourceId: string, metadata?: Record<string, any>) => void;
}