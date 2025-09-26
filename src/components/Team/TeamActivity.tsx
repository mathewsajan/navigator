import React from 'react';
import { User, Chrome as Home, ClipboardCheck, Image, Settings, UserPlus, UserMinus, Clock } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import type { TeamActivity as TeamActivityType, ActivityAction } from '@/types/team';

interface TeamActivityProps {
  activities: TeamActivityType[];
  loading?: boolean;
  limit?: number;
}

const getActivityIcon = (action: ActivityAction) => {
  switch (action) {
    case 'member_joined':
    case 'member_invited':
      return <UserPlus className="w-4 h-4 text-green-600" />;
    case 'member_left':
    case 'member_removed':
      return <UserMinus className="w-4 h-4 text-red-600" />;
    case 'property_created':
    case 'property_updated':
    case 'property_deleted':
      return <Home className="w-4 h-4 text-blue-600" />;
    case 'evaluation_created':
    case 'evaluation_updated':
    case 'evaluation_completed':
      return <ClipboardCheck className="w-4 h-4 text-purple-600" />;
    case 'media_uploaded':
      return <Image className="w-4 h-4 text-orange-600" />;
    case 'team_settings_updated':
      return <Settings className="w-4 h-4 text-gray-600" />;
    default:
      return <Clock className="w-4 h-4 text-gray-600" />;
  }
};

const getActivityColor = (action: ActivityAction) => {
  switch (action) {
    case 'member_joined':
    case 'member_invited':
      return 'bg-green-100 border-green-200';
    case 'member_left':
    case 'member_removed':
      return 'bg-red-100 border-red-200';
    case 'property_created':
    case 'property_updated':
    case 'property_deleted':
      return 'bg-blue-100 border-blue-200';
    case 'evaluation_created':
    case 'evaluation_updated':
    case 'evaluation_completed':
      return 'bg-purple-100 border-purple-200';
    case 'media_uploaded':
      return 'bg-orange-100 border-orange-200';
    case 'team_settings_updated':
      return 'bg-gray-100 border-gray-200';
    default:
      return 'bg-gray-100 border-gray-200';
  }
};

const getActivityMessage = (activity: TeamActivityType): string => {
  const userName = activity.user_profile?.full_name || 'Someone';
  
  switch (activity.action) {
    case 'member_joined':
      return `${userName} joined the team`;
    case 'member_invited':
      return `${userName} invited a new member`;
    case 'member_left':
      return `${userName} left the team`;
    case 'member_removed':
      return `${userName} removed a team member`;
    case 'property_created':
      return `${userName} added a new property`;
    case 'property_updated':
      return `${userName} updated a property`;
    case 'property_deleted':
      return `${userName} deleted a property`;
    case 'evaluation_created':
      return `${userName} started a property evaluation`;
    case 'evaluation_updated':
      return `${userName} updated an evaluation`;
    case 'evaluation_completed':
      return `${userName} completed an evaluation`;
    case 'media_uploaded':
      return `${userName} uploaded media files`;
    case 'team_settings_updated':
      return `${userName} updated team settings`;
    default:
      return `${userName} performed an action`;
  }
};

const getActivityDetails = (activity: TeamActivityType): string | null => {
  const metadata = activity.metadata;
  
  switch (activity.action) {
    case 'member_invited':
      return metadata?.email ? `Invited: ${metadata.email}` : null;
    case 'property_created':
    case 'property_updated':
      return metadata?.address ? `Property: ${metadata.address}` : null;
    case 'evaluation_completed':
      return metadata?.score ? `Score: ${metadata.score}/100` : null;
    case 'media_uploaded':
      return metadata?.file_count ? `${metadata.file_count} files` : null;
    case 'team_settings_updated':
      return metadata?.updated_settings?.length 
        ? `Updated: ${metadata.updated_settings.join(', ')}` 
        : null;
    default:
      return null;
  }
};

export const TeamActivity: React.FC<TeamActivityProps> = ({
  activities,
  loading = false,
  limit,
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg animate-pulse">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-300 rounded w-1/2" />
            </div>
            <div className="w-16 h-3 bg-gray-300 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No recent activity</p>
        <p className="text-sm text-gray-500 mt-1">
          Team activities will appear here as members collaborate
        </p>
      </div>
    );
  }

  const displayActivities = limit ? activities.slice(0, limit) : activities;

  return (
    <div className="space-y-2">
      {displayActivities.map((activity) => {
        const message = getActivityMessage(activity);
        const details = getActivityDetails(activity);
        const icon = getActivityIcon(activity.action);
        const colorClass = getActivityColor(activity.action);

        return (
          <div
            key={activity.id}
            className={`flex items-start space-x-3 p-3 rounded-lg border ${colorClass}`}
          >
            {/* Activity Icon */}
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 border">
              {icon}
            </div>

            {/* Activity Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {message}
              </p>
              
              {details && (
                <p className="text-xs text-gray-600 mt-1">
                  {details}
                </p>
              )}
              
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                {formatRelativeTime(activity.created_at)}
              </div>
            </div>

            {/* User Avatar */}
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              {activity.user_profile?.avatar_url ? (
                <img
                  src={activity.user_profile.avatar_url}
                  alt={activity.user_profile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-3 h-3 text-gray-500" />
              )}
            </div>
          </div>
        );
      })}

      {limit && activities.length > limit && (
        <div className="text-center pt-3">
          <p className="text-sm text-gray-500">
            Showing {limit} of {activities.length} activities
          </p>
        </div>
      )}
    </div>
  );
};