import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Mail, 
  Link as LinkIcon, 
  UserPlus, 
  Clock,
  Share2,
  QrCode
} from 'lucide-react';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import type { TeamInviteResponse } from '@/types/team';

interface TeamInviteProps {
  onInvite: (email?: string) => Promise<TeamInviteResponse>;
  loading?: boolean;
}

export const TeamInvite: React.FC<TeamInviteProps> = ({
  onInvite,
  loading = false,
}) => {
  const [inviteMode, setInviteMode] = useState<'link' | 'email'>('link');
  const [email, setEmail] = useState('');
  const [inviteResult, setInviteResult] = useState<TeamInviteResponse | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async () => {
    setIsInviting(true);
    setInviteResult(null);

    try {
      const result = await onInvite(inviteMode === 'email' ? email : undefined);
      setInviteResult(result);
      
      if (result.success && inviteMode === 'email') {
        setEmail(''); // Clear email after successful invite
      }
    } finally {
      setIsInviting(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'code' | 'url') => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const shareInvite = async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join our team',
          text: 'You\'ve been invited to join our team on Hausee Navigator',
          url: url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      copyToClipboard(url, 'url');
    }
  };

  const formatExpirationTime = (expiresAt: string) => {
    const expiration = new Date(expiresAt);
    const now = new Date();
    const diffHours = Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours <= 1) {
      return 'Expires in less than 1 hour';
    } else if (diffHours <= 24) {
      return `Expires in ${diffHours} hours`;
    } else {
      return `Expires on ${expiration.toLocaleDateString()}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Invite Mode Selection */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setInviteMode('link')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            inviteMode === 'link'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <LinkIcon className="w-4 h-4 inline mr-2" />
          Invite Link
        </button>
        <button
          onClick={() => setInviteMode('email')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            inviteMode === 'email'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Mail className="w-4 h-4 inline mr-2" />
          Email Invite
        </button>
      </div>

      {/* Invite Form */}
      <div className="space-y-4">
        {inviteMode === 'email' && (
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="input"
              disabled={isInviting}
            />
          </div>
        )}

        <button
          onClick={handleInvite}
          disabled={isInviting || (inviteMode === 'email' && !email.trim())}
          className="btn-primary w-full flex items-center justify-center space-x-2"
        >
          {isInviting ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>
                {inviteMode === 'email' ? 'Send Email Invite' : 'Generate Invite Link'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Invite Result */}
      {inviteResult && (
        <div className="space-y-4">
          {inviteResult.success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Check className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-sm font-medium text-green-900">
                  {inviteMode === 'email' ? 'Email Sent!' : 'Invite Link Generated!'}
                </h3>
              </div>

              {inviteResult.invite_code && (
                <div className="space-y-3">
                  {/* Invite Code */}
                  <div>
                    <label className="block text-xs font-medium text-green-800 mb-1">
                      Invite Code
                    </label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-lg font-mono text-center">
                        {inviteResult.invite_code}
                      </code>
                      <button
                        onClick={() => copyToClipboard(inviteResult.invite_code!, 'code')}
                        className="p-2 bg-white border border-green-300 rounded hover:bg-green-50 transition-colors"
                        title="Copy invite code"
                      >
                        {copiedCode ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-green-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Invite URL */}
                  {inviteResult.invite_url && (
                    <div>
                      <label className="block text-xs font-medium text-green-800 mb-1">
                        Invite Link
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={inviteResult.invite_url}
                          readOnly
                          className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-sm"
                        />
                        <button
                          onClick={() => copyToClipboard(inviteResult.invite_url!, 'url')}
                          className="p-2 bg-white border border-green-300 rounded hover:bg-green-50 transition-colors"
                          title="Copy invite link"
                        >
                          {copiedUrl ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-green-600" />
                          )}
                        </button>
                        
                        {navigator.share && (
                          <button
                            onClick={() => shareInvite(inviteResult.invite_url!)}
                            className="p-2 bg-white border border-green-300 rounded hover:bg-green-50 transition-colors"
                            title="Share invite link"
                          >
                            <Share2 className="w-4 h-4 text-green-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Expiration Info */}
                  {inviteResult.expires_at && (
                    <div className="flex items-center text-xs text-green-700">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatExpirationTime(inviteResult.expires_at)}
                    </div>
                  )}
                </div>
              )}

              {inviteMode === 'email' && (
                <p className="text-sm text-green-700 mt-2">
                  An invitation email has been sent to <strong>{email}</strong>
                </p>
              )}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center mr-2">
                  <span className="text-white text-xs">!</span>
                </div>
                <h3 className="text-sm font-medium text-red-900">
                  Invite Failed
                </h3>
              </div>
              <p className="text-sm text-red-700">
                {inviteResult.error || 'An unexpected error occurred'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">
          How it works
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          {inviteMode === 'email' ? (
            <>
              <li>• An email will be sent with the invite link</li>
              <li>• The recipient can click the link to join your team</li>
              <li>• Single-use invite that expires in 24 hours</li>
            </>
          ) : (
            <>
              <li>• Share the invite code or link with team members</li>
              <li>• They can use the code on the join page</li>
              <li>• Link can be used up to 10 times and expires in 24 hours</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};