import React, { useState } from 'react';
import { Users, Plus, UserPlus, Loader as Loader2, Copy, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Team setup component for creating or joining teams
 * Handles team creation and invite code functionality
 */
const TeamSetup: React.FC = () => {
  const { createTeam, joinTeam, userProfile } = useAuth();
  
  // UI state
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  /**
   * Handle team creation
   */
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamName.trim()) {
      setError('Team name is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: createError } = await createTeam(teamName.trim());
      
      if (createError) {
        setError(createError.message || 'Failed to create team. Please try again.');
      } else {
        setSuccess('Team created successfully!');
        setTeamName('');
      }
    } catch (error) {
      console.error('Create team error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle joining a team
   */
  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteCode.trim()) {
      setError('Invite code is required');
      return;
    }

    if (inviteCode.trim().length !== 8) {
      setError('Invite code must be 8 characters long');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: joinError } = await joinTeam(inviteCode.trim());
      
      if (joinError) {
        if (joinError.message?.includes('Invalid invite code')) {
          setError('Invalid invite code. Please check the code and try again.');
        } else {
          setError(joinError.message || 'Failed to join team. Please try again.');
        }
      } else {
        setSuccess('Successfully joined the team!');
        setInviteCode('');
      }
    } catch (error) {
      console.error('Join team error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
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
   * Clear messages when switching tabs
   */
  const handleTabSwitch = (tab: 'create' | 'join') => {
    setActiveTab(tab);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-primary-600 p-3 rounded-lg">
            <Users className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Set up your team
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create a new team or join an existing one to start collaborating
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card px-4 py-8 shadow sm:px-10">
          {/* Tab navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
            <button
              onClick={() => handleTabSwitch('create')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'create'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              disabled={loading}
            >
              <Plus className="h-4 w-4 inline mr-2" />
              Create Team
            </button>
            <button
              onClick={() => handleTabSwitch('join')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'join'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              disabled={loading}
            >
              <UserPlus className="h-4 w-4 inline mr-2" />
              Join Team
            </button>
          </div>

          {/* Error/Success messages */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
              {success}
            </div>
          )}

          {/* Create team form */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateTeam} className="space-y-6">
              <div>
                <label htmlFor="teamName" className="block text-sm font-medium text-gray-700">
                  Team name
                </label>
                <div className="mt-1">
                  <input
                    id="teamName"
                    name="teamName"
                    type="text"
                    required
                    className="input"
                    placeholder="Enter your team name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Choose a name that represents your team or organization.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full h-10 px-4 py-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Creating team...
                  </>
                ) : (
                  'Create Team'
                )}
              </button>

              {/* Show invite code after team creation */}
              {userProfile?.team_invite_code && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">
                    Your team invite code:
                  </h3>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded text-lg font-mono text-center">
                      {userProfile.team_invite_code}
                    </code>
                    <button
                      type="button"
                      onClick={copyInviteCode}
                      className="btn-secondary p-2"
                      title="Copy invite code"
                    >
                      {copiedCode ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-blue-700">
                    Share this code with team members so they can join your team.
                  </p>
                </div>
              )}
            </form>
          )}

          {/* Join team form */}
          {activeTab === 'join' && (
            <form onSubmit={handleJoinTeam} className="space-y-6">
              <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700">
                  Invite code
                </label>
                <div className="mt-1">
                  <input
                    id="inviteCode"
                    name="inviteCode"
                    type="text"
                    required
                    className="input text-center font-mono text-lg"
                    placeholder="Enter 8-character code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    disabled={loading}
                    maxLength={8}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Enter the 8-character invite code shared by your team leader.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full h-10 px-4 py-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Joining team...
                  </>
                ) : (
                  'Join Team'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamSetup;