import React, { useState } from 'react';
import { 
  Settings, 
  Bell, 
  Users, 
  Shield, 
  Save,
  RotateCcw
} from 'lucide-react';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import type { TeamSettings as TeamSettingsType, TeamRole } from '@/types/team';

interface TeamSettingsProps {
  settings: TeamSettingsType;
  onUpdate: (settings: Partial<TeamSettingsType>) => Promise<boolean>;
  canManage: boolean;
  loading?: boolean;
}

const defaultSettings: TeamSettingsType = {
  notifications: {
    email: true,
    push: true,
    realtime: true,
  },
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
};

export const TeamSettings: React.FC<TeamSettingsProps> = ({
  settings,
  onUpdate,
  canManage,
  loading = false,
}) => {
  const [localSettings, setLocalSettings] = useState<TeamSettingsType>(settings);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const updateLocalSettings = (updates: Partial<TeamSettingsType>) => {
    const newSettings = { ...localSettings, ...updates };
    setLocalSettings(newSettings);
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(settings));
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    setSaving(true);
    try {
      const success = await onUpdate(localSettings);
      if (success) {
        setHasChanges(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
  };

  const roleOptions: { value: TeamRole; label: string }[] = [
    { value: 'owner', label: 'Owner' },
    { value: 'admin', label: 'Admin' },
    { value: 'member', label: 'Member' },
    { value: 'viewer', label: 'Viewer' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" text="Loading settings..." />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="text-center py-8">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">You don't have permission to manage team settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Team Settings</h2>
        </div>

        {hasChanges && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              className="btn-secondary text-sm px-3 py-1"
              disabled={saving}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </button>
            <button
              onClick={handleSave}
              className="btn-primary text-sm px-3 py-1"
              disabled={saving}
            >
              {saving ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Bell className="w-5 h-5 text-gray-600" />
          <h3 className="text-md font-medium text-gray-900">Notifications</h3>
        </div>

        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localSettings.notifications.email}
              onChange={(e) => updateLocalSettings({
                notifications: {
                  ...localSettings.notifications,
                  email: e.target.checked,
                },
              })}
              className="rounded border-gray-300 text-coral-500 focus:ring-coral-500"
            />
            <span className="ml-2 text-sm text-gray-700">Email notifications</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localSettings.notifications.push}
              onChange={(e) => updateLocalSettings({
                notifications: {
                  ...localSettings.notifications,
                  push: e.target.checked,
                },
              })}
              className="rounded border-gray-300 text-coral-500 focus:ring-coral-500"
            />
            <span className="ml-2 text-sm text-gray-700">Push notifications</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localSettings.notifications.realtime}
              onChange={(e) => updateLocalSettings({
                notifications: {
                  ...localSettings.notifications,
                  realtime: e.target.checked,
                },
              })}
              className="rounded border-gray-300 text-coral-500 focus:ring-coral-500"
            />
            <span className="ml-2 text-sm text-gray-700">Real-time notifications</span>
          </label>
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="w-5 h-5 text-gray-600" />
          <h3 className="text-md font-medium text-gray-900">Permissions</h3>
        </div>

        <div className="space-y-6">
          {/* Invite Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Who can invite new members?
            </label>
            <div className="space-y-2">
              {roleOptions.map((role) => (
                <label key={role.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localSettings.permissions.invite_members.includes(role.value)}
                    onChange={(e) => {
                      const currentRoles = localSettings.permissions.invite_members;
                      const newRoles = e.target.checked
                        ? [...currentRoles, role.value]
                        : currentRoles.filter(r => r !== role.value);
                      
                      updateLocalSettings({
                        permissions: {
                          ...localSettings.permissions,
                          invite_members: newRoles,
                        },
                      });
                    }}
                    className="rounded border-gray-300 text-coral-500 focus:ring-coral-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{role.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Manage Properties */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Who can manage properties?
            </label>
            <div className="space-y-2">
              {roleOptions.map((role) => (
                <label key={role.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localSettings.permissions.manage_properties.includes(role.value)}
                    onChange={(e) => {
                      const currentRoles = localSettings.permissions.manage_properties;
                      const newRoles = e.target.checked
                        ? [...currentRoles, role.value]
                        : currentRoles.filter(r => r !== role.value);
                      
                      updateLocalSettings({
                        permissions: {
                          ...localSettings.permissions,
                          manage_properties: newRoles,
                        },
                      });
                    }}
                    className="rounded border-gray-300 text-coral-500 focus:ring-coral-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{role.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Delete Evaluations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Who can delete evaluations?
            </label>
            <div className="space-y-2">
              {roleOptions.map((role) => (
                <label key={role.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localSettings.permissions.delete_evaluations.includes(role.value)}
                    onChange={(e) => {
                      const currentRoles = localSettings.permissions.delete_evaluations;
                      const newRoles = e.target.checked
                        ? [...currentRoles, role.value]
                        : currentRoles.filter(r => r !== role.value);
                      
                      updateLocalSettings({
                        permissions: {
                          ...localSettings.permissions,
                          delete_evaluations: newRoles,
                        },
                      });
                    }}
                    className="rounded border-gray-300 text-coral-500 focus:ring-coral-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{role.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Collaboration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="w-5 h-5 text-gray-600" />
          <h3 className="text-md font-medium text-gray-900">Collaboration</h3>
        </div>

        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localSettings.collaboration.show_cursors}
              onChange={(e) => updateLocalSettings({
                collaboration: {
                  ...localSettings.collaboration,
                  show_cursors: e.target.checked,
                },
              })}
              className="rounded border-gray-300 text-coral-500 focus:ring-coral-500"
            />
            <span className="ml-2 text-sm text-gray-700">Show team member cursors</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auto-save interval (seconds)
            </label>
            <select
              value={localSettings.collaboration.auto_save_interval}
              onChange={(e) => updateLocalSettings({
                collaboration: {
                  ...localSettings.collaboration,
                  auto_save_interval: Number(e.target.value),
                },
              })}
              className="input w-32"
            >
              <option value={10}>10 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={300}>5 minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conflict resolution strategy
            </label>
            <select
              value={localSettings.collaboration.conflict_resolution}
              onChange={(e) => updateLocalSettings({
                collaboration: {
                  ...localSettings.collaboration,
                  conflict_resolution: e.target.value as 'last_write_wins' | 'operational_transform',
                },
              })}
              className="input"
            >
              <option value="last_write_wins">Last write wins</option>
              <option value="operational_transform">Operational transform</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              How to handle simultaneous edits by multiple team members
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};