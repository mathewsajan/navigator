import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Activity, 
  Settings as SettingsIcon,
  ArrowLeft
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useTeamCollaboration } from '@/hooks/useTeamCollaboration';
import { TeamMemberList } from './TeamMemberList';
import { TeamInvite } from './TeamInvite';
import { TeamActivity } from './TeamActivity';
import { TeamSettings } from './TeamSettings';
import { LoadingSpinner } from '../UI/LoadingSpinner';

interface TeamManagerProps {
  teamId: string;
  teamName: string;
  onBack?: () => void;
}

type TabType = 'members' | 'invite' | 'activity' | 'settings';

export const TeamManager: React.FC<TeamManagerProps> = ({
  teamId,
  teamName,
  onBack,
}) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('members');

  const {
    teamMembers,
    userPresence,
    activities,
    loading,
    error,
    inviteTeamMember,
    removeTeamMember,
    updateMemberRole,
    updateTeamSettings,
  } = useTeamCollaboration(teamId);

  // Get current user's role and permissions
  const currentMember = teamMembers.find(member => member.user_id === user?.id);
  const canManageMembers = currentMember?.role === 'owner' || currentMember?.role === 'admin';
  const canManageSettings = currentMember?.role === 'owner';

  const tabs = [
    { id: 'members' as TabType, label: 'Members', icon: Users, count: teamMembers.length },
    { id: 'invite' as TabType, label: 'Invite', icon: UserPlus },
    { id: 'activity' as TabType, label: 'Activity', icon: Activity, count: activities.length },
    { id: 'settings' as TabType, label: 'Settings', icon: SettingsIcon },
  ];

  if (loading && teamMembers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading team..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Team</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              {onBack && (
                <button
                  onClick={onBack}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{teamName}</h1>
                <p className="text-sm text-gray-500">Team Management</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              // Hide settings tab if user can't manage settings
              if (tab.id === 'settings' && !canManageSettings) {
                return null;
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-coral-500 text-coral-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      isActive
                        ? 'bg-coral-100 text-coral-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'members' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
              <button
                onClick={() => setActiveTab('invite')}
                className="btn-primary text-sm px-3 py-1"
                disabled={!canManageMembers}
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Invite Member
              </button>
            </div>

            <TeamMemberList
              members={teamMembers}
              userPresence={userPresence}
              currentUserId={user?.id || ''}
              onRemoveMember={removeTeamMember}
              onUpdateRole={updateMemberRole}
              canManageMembers={canManageMembers}
              loading={loading}
            />
          </div>
        )}

        {activeTab === 'invite' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Invite Team Members</h2>
              <p className="text-sm text-gray-600 mt-1">
                Add new members to collaborate on property evaluations
              </p>
            </div>

            <TeamInvite
              onInvite={inviteTeamMember}
              loading={loading}
            />
          </div>
        )}

        {activeTab === 'activity' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Team Activity</h2>
              <p className="text-sm text-gray-600 mt-1">
                Recent actions and changes by team members
              </p>
            </div>

            <TeamActivity
              activities={activities}
              loading={loading}
            />
          </div>
        )}

        {activeTab === 'settings' && canManageSettings && (
          <div>
            <TeamSettings
              settings={teamMembers[0]?.team?.settings || {
                notifications: { email: true, push: true, realtime: true },
                permissions: {
                  invite_members: ['owner', 'admin'],
                  manage_properties: ['owner', 'admin', 'member'],
                  delete_evaluations: ['owner', 'admin'],
                },
                collaboration: {
                  show_cursors: true,
                  auto_save_interval: 30,
                  conflict_resolution: 'last_write_wins',
                },
              }}
              onUpdate={updateTeamSettings}
              canManage={canManageSettings}
              loading={loading}
            />
          </div>
        )}
      </div>
    </div>
  );
};