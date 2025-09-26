import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Plus, 
  Settings,
  LogOut,
  Copy,
  Check,
  UserMinus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PropertiesManager } from '../Properties';
import { teamHelpers, User } from '../../lib/supabase';
import LoadingSpinner from '../UI/LoadingSpinner';

/**
 * Main dashboard component for authenticated users
 * Shows team information, properties, and navigation
 */
const Dashboard: React.FC = () => {
  const { user, userProfile, team, signOut, leaveTeam } = useAuth();
  
  // State for team members
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  /**
   * Load team members
   */
  const loadTeamMembers = async () => {
    if (!team?.id) return;

    setLoadingMembers(true);
    try {
      const { members, error } = await teamHelpers.getTeamMembers(team.id);
      if (error) {
        console.error('Error loading team members:', error);
      } else {
        setTeamMembers(members || []);
      }
    } catch (error) {
      console.error('Error loading team members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  /**
   * Copy invite code to clipboard
   */
  const copyInviteCode = async () => {
    if (!userProfile?.team_invite_code) return;

    try {
      await navigator.clipboard.writeText(userProfile.team_invite_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error('Failed to copy invite code:', error);
    }
  };

  /**
   * Handle leaving team
   */
  const handleLeaveTeam = async () => {
    try {
      const { error } = await leaveTeam();
      if (error) {
        console.error('Error leaving team:', error);
      }
    } catch (error) {
      console.error('Error leaving team:', error);
    } finally {
      setShowLeaveConfirm(false);
    }
  };

  /**
   * Handle sign out
   */
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Load team members when component mounts or team changes
  useEffect(() => {
    loadTeamMembers();
  }, [team?.id]);

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and title */}
            <div className="flex items-center space-x-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Hausee Navigator</h1>
                {team && (
                  <p className="text-sm text-gray-500">{team.name}</p>
                )}
              </div>
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userProfile.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{userProfile.role}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {team ? (
          <div className="space-y-8">
            {/* Welcome section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {userProfile.full_name.split(' ')[0]}!
              </h2>
              <p className="text-gray-600">
                You're part of <strong>{team.name}</strong> as a {userProfile.role}.
              </p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Properties</p>
                    <p className="text-2xl font-semibold text-gray-900">0</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Evaluations</p>
                    <p className="text-2xl font-semibold text-gray-900">0</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Team Members</p>
                    <p className="text-2xl font-semibold text-gray-900">{teamMembers.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Team section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Team members */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
                  {userProfile.role === 'primary' && userProfile.team_invite_code && (
                    <button
                      onClick={copyInviteCode}
                      className="btn-secondary text-sm px-3 py-1"
                      title="Copy invite code"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Invite Code
                        </>
                      )}
                    </button>
                  )}
                </div>

                {loadingMembers ? (
                  <LoadingSpinner text="Loading team members..." />
                ) : (
                  <div className="space-y-3">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{member.full_name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            member.role === 'primary' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {member.role}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {userProfile.role === 'primary' && userProfile.team_invite_code && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900 mb-2">Share your invite code:</p>
                    <code className="block w-full px-3 py-2 bg-white border border-blue-300 rounded text-center font-mono">
                      {userProfile.team_invite_code}
                    </code>
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                
                <div className="space-y-3">
                  <button className="w-full btn-primary justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Property
                  </button>
                  
                  <button className="w-full btn-secondary justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Evaluations
                  </button>
                  
                  <button className="w-full btn-secondary justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Team Settings
                  </button>

                  {userProfile.role === 'collaborator' && (
                    <button
                      onClick={() => setShowLeaveConfirm(true)}
                      className="w-full btn-secondary justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      Leave Team
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Properties section placeholder */}
            <div className="card p-8 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Properties Yet</h3>
    <PropertiesManager />
  );
};

export default Dashboard;