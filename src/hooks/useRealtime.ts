import { useEffect, useRef, useCallback, useState } from 'react';
import { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { 
  RealtimeConnection, 
  ConnectionStatus, 
  UserPresence, 
  UseRealtimeReturn 
} from '@/types/team';

interface ChannelSubscription {
  channel: RealtimeChannel;
  callbacks: Map<string, (payload: any) => void>;
  lastActivity: number;
}

interface RealtimeConfig {
  heartbeatInterval: number;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  presenceUpdateInterval: number;
}

const DEFAULT_CONFIG: RealtimeConfig = {
  heartbeatInterval: 30000, // 30 seconds
  reconnectInterval: 1000, // Start with 1 second
  maxReconnectAttempts: 10,
  presenceUpdateInterval: 5000, // 5 seconds
};

/**
 * Custom hook for managing Supabase realtime connections with connection pooling,
 * automatic reconnection, and presence management.
 * 
 * Features:
 * - Single connection per user session
 * - Automatic reconnection with exponential backoff
 * - Presence management with heartbeat
 * - Memory leak prevention with proper cleanup
 * - Connection state management
 */
export const useRealtime = (config: Partial<RealtimeConfig> = {}): UseRealtimeReturn => {
  const { user } = useAuthStore();
  const configRef = useRef<RealtimeConfig>({ ...DEFAULT_CONFIG, ...config });
  
  // Connection state
  const [connection, setConnection] = useState<RealtimeConnection>({
    id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'disconnected',
    last_ping: new Date().toISOString(),
    reconnect_attempts: 0,
    subscriptions: [],
  });

  // Internal state
  const channelsRef = useRef<Map<string, ChannelSubscription>>(new Map());
  const heartbeatRef = useRef<NodeJS.Timeout>();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const presenceRef = useRef<UserPresence | null>(null);
  const isConnectingRef = useRef(false);

  /**
   * Update connection status with proper state management
   */
  const updateConnectionStatus = useCallback((status: ConnectionStatus, error?: string) => {
    setConnection(prev => ({
      ...prev,
      status,
      last_ping: new Date().toISOString(),
      ...(error && { error }),
    }));
  }, []);

  /**
   * Calculate reconnection delay with exponential backoff
   */
  const getReconnectDelay = useCallback((attempt: number): number => {
    const baseDelay = configRef.current.reconnectInterval;
    const maxDelay = 30000; // Max 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }, []);

  /**
   * Start heartbeat to maintain connection and update presence
   */
  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }

    heartbeatRef.current = setInterval(() => {
      if (connection.status === 'connected' && presenceRef.current) {
        // Update presence with current timestamp
        const updatedPresence: UserPresence = {
          ...presenceRef.current,
          last_seen: new Date().toISOString(),
        };

        // Send presence update to all subscribed channels
        channelsRef.current.forEach((subscription, channelName) => {
          if (channelName.includes('presence')) {
            subscription.channel.track(updatedPresence);
          }
        });

        setConnection(prev => ({
          ...prev,
          last_ping: new Date().toISOString(),
        }));
      }
    }, configRef.current.heartbeatInterval);
  }, [connection.status]);

  /**
   * Stop heartbeat
   */
  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = undefined;
    }
  }, []);

  /**
   * Reconnect with exponential backoff
   */
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (connection.reconnect_attempts >= configRef.current.maxReconnectAttempts) {
      updateConnectionStatus('error', 'Max reconnection attempts reached');
      return;
    }

    const delay = getReconnectDelay(connection.reconnect_attempts);
    updateConnectionStatus('reconnecting');

    reconnectTimeoutRef.current = setTimeout(() => {
      setConnection(prev => ({
        ...prev,
        reconnect_attempts: prev.reconnect_attempts + 1,
      }));
      
      connect();
    }, delay);
  }, [connection.reconnect_attempts, getReconnectDelay, updateConnectionStatus]);

  /**
   * Establish realtime connection
   */
  const connect = useCallback(async () => {
    if (!user || isConnectingRef.current) return;

    try {
      isConnectingRef.current = true;
      updateConnectionStatus('connecting');

      // Test connection with a simple query
      const { error } = await supabase.from('user_profiles').select('id').limit(1);
      
      if (error) {
        throw new Error(`Connection test failed: ${error.message}`);
      }

      updateConnectionStatus('connected');
      startHeartbeat();

      // Reset reconnection attempts on successful connection
      setConnection(prev => ({
        ...prev,
        reconnect_attempts: 0,
      }));

    } catch (error) {
      console.error('Realtime connection failed:', error);
      updateConnectionStatus('error', error instanceof Error ? error.message : 'Connection failed');
      scheduleReconnect();
    } finally {
      isConnectingRef.current = false;
    }
  }, [user, updateConnectionStatus, startHeartbeat, scheduleReconnect]);

  /**
   * Disconnect and cleanup
   */
  const disconnect = useCallback(() => {
    stopHeartbeat();
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    // Unsubscribe from all channels
    channelsRef.current.forEach((subscription) => {
      subscription.channel.unsubscribe();
    });
    channelsRef.current.clear();

    updateConnectionStatus('disconnected');
    
    setConnection(prev => ({
      ...prev,
      subscriptions: [],
      reconnect_attempts: 0,
    }));
  }, [stopHeartbeat, updateConnectionStatus]);

  /**
   * Subscribe to a realtime channel with callback management
   */
  const subscribe = useCallback((channelName: string, callback: (payload: any) => void): (() => void) => {
    if (!user || connection.status !== 'connected') {
      console.warn('Cannot subscribe: not connected');
      return () => {};
    }

    let subscription = channelsRef.current.get(channelName);

    if (!subscription) {
      // Create new channel subscription
      const channel = supabase.channel(channelName, {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      subscription = {
        channel,
        callbacks: new Map(),
        lastActivity: Date.now(),
      };

      // Set up channel event handlers
      channel
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
          subscription!.lastActivity = Date.now();
          subscription!.callbacks.forEach(cb => cb(payload));
        })
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channel.presenceState();
          subscription!.callbacks.forEach(cb => cb({ type: 'presence', payload: presenceState }));
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          subscription!.callbacks.forEach(cb => cb({ type: 'presence_join', payload: newPresences }));
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          subscription!.callbacks.forEach(cb => cb({ type: 'presence_leave', payload: leftPresences }));
        })
        .on('broadcast', { event: '*' }, (payload) => {
          subscription!.callbacks.forEach(cb => cb({ type: 'broadcast', payload }));
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to channel: ${channelName}`);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Channel error: ${channelName}`);
          }
        });

      channelsRef.current.set(channelName, subscription);
      
      setConnection(prev => ({
        ...prev,
        subscriptions: [...prev.subscriptions, channelName],
      }));
    }

    // Add callback to existing subscription
    const callbackId = `callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    subscription.callbacks.set(callbackId, callback);

    // Return unsubscribe function
    return () => {
      const sub = channelsRef.current.get(channelName);
      if (sub) {
        sub.callbacks.delete(callbackId);
        
        // If no more callbacks, remove the channel
        if (sub.callbacks.size === 0) {
          sub.channel.unsubscribe();
          channelsRef.current.delete(channelName);
          
          setConnection(prev => ({
            ...prev,
            subscriptions: prev.subscriptions.filter(s => s !== channelName),
          }));
        }
      }
    };
  }, [user, connection.status]);

  /**
   * Unsubscribe from a channel
   */
  const unsubscribe = useCallback((channelName: string) => {
    const subscription = channelsRef.current.get(channelName);
    if (subscription) {
      subscription.channel.unsubscribe();
      channelsRef.current.delete(channelName);
      
      setConnection(prev => ({
        ...prev,
        subscriptions: prev.subscriptions.filter(s => s !== channelName),
      }));
    }
  }, []);

  /**
   * Update user presence
   */
  const updatePresence = useCallback((presence: Partial<UserPresence>) => {
    if (!user) return;

    const updatedPresence: UserPresence = {
      user_id: user.id,
      team_id: presence.team_id || '',
      status: presence.status || 'online',
      last_seen: new Date().toISOString(),
      ...presence,
    };

    presenceRef.current = updatedPresence;

    // Update presence in all presence channels
    channelsRef.current.forEach((subscription, channelName) => {
      if (channelName.includes('presence')) {
        subscription.channel.track(updatedPresence);
      }
    });
  }, [user]);

  /**
   * Send message to a channel
   */
  const sendMessage = useCallback(async (channelName: string, event: string, payload: any): Promise<RealtimeChannelSendResponse> => {
    const subscription = channelsRef.current.get(channelName);
    if (!subscription) {
      throw new Error(`Channel ${channelName} not found`);
    }

    return subscription.channel.send({
      type: 'broadcast',
      event,
      payload,
    });
  }, []);

  /**
   * Manual reconnection
   */
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => connect(), 1000);
  }, [disconnect, connect]);

  // Initialize connection when user is available
  useEffect(() => {
    if (user && connection.status === 'disconnected') {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  // Handle browser visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence({ status: 'away' });
      } else {
        updatePresence({ status: 'online' });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updatePresence]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connection,
    subscribe,
    unsubscribe,
    updatePresence,
    sendMessage,
    isConnected: connection.status === 'connected',
    reconnect,
  };
};