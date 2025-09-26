import React, { useState } from 'react';
import { User, Crown, Shield, Eye, MoveVertical as MoreVertical, UserMinus, UserCheck, Clock, Wifi, WifiOff } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import type { TeamMember, UserPresence, TeamRole } from '@/types/team';

interface TeamMemberListProps {
  members: TeamMember[];
  userPresence: Record<string, UserPresence>;
  currentUserId: string;
  onRemoveMember: (memberId: string) => Promise<boolean>;
  onUpdateRole: (memberId: string, role: TeamRole) => Promise<boolean>;
  canManageMembers: boolean;
  loading?: boolean;
}

interface MemberMenuProps {
  member: TeamMember;
  onRemove: () => void;
  onUpdateRole: (role: TeamRole) => void;
  canManage: boolean;
  isCurrentUser: boolean;
}

const MemberMenu: React.FC<MemberMenuProps> = ({
  member,
  onRemove,
  onUpdateRole,
  canManage,
  isCurrentUser,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!canManage || isCurrentUser || member.role === 'owner') {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Member options"
      >
        <MoreVertical className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-8 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]">
            {member.role !== 'admin' && (
              <button
                onClick={() => {
                  onUpdateRole('admin');
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
              >
                <Shield className="w-4 h-4 mr-2 text-blue-500" />
                Make Admin
              </button>
            )}
            
            {member.role === 'admin' && (
              <button
                onClick={() => {
                  onUpdateRole('member');
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
              >
                <User className="w-4 h-4 mr-2 text-gray-500" />
                Make Member
              </button>
            )}
            
            <button
              onClick={() => {
                onRemove();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center"
            >
              <UserMinus className="w-4 h-4 mr-2" />
              Remove Member
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const getRoleIcon = (role: TeamRole) => {
  switch (role) {
    case 'owner':
      return <Crown className="w-4 h-4 text-yellow-500" />;
    case 'admin':
      return <Shield className="w-4 h-4 text-blue-500" />;
    case 'member':
      return <User className="w-4 h-4 text-gray-500" />;
    case 'viewer':
      return <Eye className="w-4 h-4 text-gray-400" />;
    default:
      return <User className="w-4 h-4 text-gray-500" />;
  }
};

const getRoleLabel = (role: TeamRole) => {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'admin':
      return 'Admin';
    case 'member':
      return 'Member';
    case 'viewer':
      return 'Viewer';
    default:
      return 'Member';
  }
};

const getPresenceStatus = (presence?: UserPresence) => {
  if (!presence) return { status: 'offline', color: 'bg-gray-400', label: 'Offline' };

  const lastSeen = new Date(presence.last_seen);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);

  if (diffMinutes < 5) {
    switch (presence.status) {
      case 'online':
        return { status: 'online', color: 'bg-green-500', label: 'Online' };
      case 'busy':
        return { status: 'busy', color: 'bg-red-500', label: 'Busy' };
      case 'away':
        return { status: 'away', color: 'bg-yellow-500', label: 'Away' };
      default:
        return { status: 'offline', color: 'bg-gray-400', label: 'Offline' };
    }
  }

  return { status: 'offline', color: 'bg-gray-400', label: `Last seen ${formatRelativeTime(lastSeen)}` };
};

export const TeamMemberList: React.FC<TeamMemberListProps> = ({
  members,
  userPresence,
  currentUserId,
  onRemoveMember,
  onUpdateRole,
  canManageMembers,
  loading = false,
}) => {
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    setRemovingMemberId(memberId);
    try {
      await onRemoveMember(memberId);
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleUpdateRole = async (memberId: string, role: TeamRole) => {
    setUpdatingRoleId(memberId);
    try {
      await onUpdateRole(memberId, role);
    } finally {
      setUpdatingRoleId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg animate-pulse">
            <div className="w-10 h-10 bg-gray-300 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded w-32 mb-1" />
              <div className="h-3 bg-gray-300 rounded w-24" />
            </div>
            <div className="w-16 h-6 bg-gray-300 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No team members found</p>
      </div>
    );
  }

  // Sort members: owner first, then by role, then by name
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { owner: 0, admin: 1, member: 2, viewer: 3 };
    const aOrder = roleOrder[a.role] ?? 4;
    const bOrder = roleOrder[b.role] ?? 4;
    
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    
    return (a.user_profile?.full_name || '').localeCompare(b.user_profile?.full_name || '');
  });

  return (
    <div className="space-y-2">
      {sortedMembers.map((member) => {
        const presence = userPresence[member.user_id];
        const presenceInfo = getPresenceStatus(presence);
        const isCurrentUser = member.user_id === currentUserId;
        const isRemoving = removingMemberId === member.id;
        const isUpdatingRole = updatingRoleId === member.id;

        return (
          <div
            key={member.id}
            className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
              isCurrentUser 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            {/* Avatar */}
            <div className="relative">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {member.user_profile?.avatar_url ? (
                  <img
                    src={member.user_profile.avatar_url}
                    alt={member.user_profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-gray-500" />
                )}
              </div>
              
              {/* Presence indicator */}
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${presenceInfo.color}`}
                title={presenceInfo.label}
              />
            </div>

            {/* Member info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {member.user_profile?.full_name || 'Unknown User'}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs text-blue-600 font-normal">(You)</span>
                  )}
                </p>
                
                {/* Online indicator */}
                {presenceInfo.status === 'online' ? (
                  <Wifi className="w-3 h-3 text-green-500" title="Online" />
                ) : (
                  <WifiOff className="w-3 h-3 text-gray-400" title="Offline" />
                )}
              </div>
              
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-xs text-gray-500">
                  {member.user_profile?.email}
                </p>
                
                {presence?.current_page && (
                  <span className="text-xs text-gray-400">
                    • {presence.current_page.replace('/', '') || 'Dashboard'}
                  </span>
                )}
              </div>
              
              <p className="text-xs text-gray-400 mt-1">
                Joined {formatRelativeTime(member.joined_at)}
              </p>
            </div>

            {/* Role badge */}
            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                member.role === 'owner' 
                  ? 'bg-yellow-100 text-yellow-800'
                  : member.role === 'admin'
                  ? 'bg-blue-100 text-blue-800'
                  : member.role === 'member'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {getRoleIcon(member.role)}
                <span>{getRoleLabel(member.role)}</span>
              </div>

              {/* Loading states */}
              {(isRemoving || isUpdatingRole) && (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              )}

              {/* Member menu */}
              <MemberMenu
                member={member}
                onRemove={() => handleRemoveMember(member.id)}
                onUpdateRole={(role) => handleUpdateRole(member.id, role)}
                canManage={canManageMembers}
                isCurrentUser={isCurrentUser}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};