/*
  # Team Collaboration System

  1. New Tables
    - `team_invites` - Secure invite codes with expiration
    - `team_activities` - Activity tracking for team actions
    - `user_presence` - Real-time presence tracking
    - `collaborative_edits` - Operational transformation support
    - `notification_preferences` - User notification settings

  2. Security
    - Enable RLS on all tables
    - Add policies for team-based access control
    - Ensure proper foreign key relationships

  3. Performance
    - Add indexes for efficient querying
    - Optimize for real-time subscriptions
*/

-- Team Invites Table
CREATE TABLE IF NOT EXISTS team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  invite_code text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  expires_at timestamptz NOT NULL,
  max_uses integer DEFAULT 10,
  current_uses integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Team Activities Table
CREATE TABLE IF NOT EXISTS team_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL CHECK (action IN (
    'member_joined', 'member_left', 'member_invited', 'member_removed', 'member_role_updated',
    'property_created', 'property_updated', 'property_deleted',
    'evaluation_created', 'evaluation_updated', 'evaluation_completed',
    'media_uploaded', 'team_settings_updated'
  )),
  resource_type text NOT NULL CHECK (resource_type IN ('property', 'evaluation', 'media', 'team', 'member')),
  resource_id text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- User Presence Table
CREATE TABLE IF NOT EXISTS user_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_seen timestamptz DEFAULT now(),
  current_page text,
  cursor_position jsonb,
  selection jsonb,
  metadata jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, team_id)
);

-- Collaborative Edits Table
CREATE TABLE IF NOT EXISTS collaborative_edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type text NOT NULL CHECK (resource_type IN ('property', 'evaluation', 'media', 'team')),
  resource_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  operation jsonb NOT NULL,
  timestamp timestamptz DEFAULT now(),
  applied boolean DEFAULT false,
  conflicts text[],
  created_at timestamptz DEFAULT now()
);

-- Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  realtime_notifications boolean DEFAULT true,
  activity_types text[] DEFAULT ARRAY[
    'member_joined', 'property_created', 'evaluation_completed'
  ],
  quiet_hours jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, team_id)
);

-- Add settings column to teams table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'settings'
  ) THEN
    ALTER TABLE teams ADD COLUMN settings jsonb DEFAULT '{
      "notifications": {"email": true, "push": true, "realtime": true},
      "permissions": {
        "invite_members": ["owner", "admin"],
        "manage_properties": ["owner", "admin", "member"],
        "delete_evaluations": ["owner", "admin"]
      },
      "collaboration": {
        "show_cursors": true,
        "auto_save_interval": 30,
        "conflict_resolution": "last_write_wins"
      }
    }';
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_invites_code ON team_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_team_invites_team_active ON team_invites(team_id, is_active);
CREATE INDEX IF NOT EXISTS idx_team_invites_expires ON team_invites(expires_at);

CREATE INDEX IF NOT EXISTS idx_team_activities_team_created ON team_activities(team_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_activities_user ON team_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_team_activities_action ON team_activities(action);

CREATE INDEX IF NOT EXISTS idx_user_presence_team ON user_presence(team_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_user_team ON user_presence(user_id, team_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen);

CREATE INDEX IF NOT EXISTS idx_collaborative_edits_resource ON collaborative_edits(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_collaborative_edits_user ON collaborative_edits(user_id);
CREATE INDEX IF NOT EXISTS idx_collaborative_edits_timestamp ON collaborative_edits(timestamp);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_team ON notification_preferences(user_id, team_id);

-- Enable Row Level Security
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborative_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_invites
CREATE POLICY "Team members can view team invites"
  ON team_invites FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_invites.team_id
      AND tm.user_id = auth.uid()
      AND tm.is_active = true
    )
  );

CREATE POLICY "Team admins can create invites"
  ON team_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_invites.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
      AND tm.is_active = true
    )
  );

CREATE POLICY "Team admins can update invites"
  ON team_invites FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_invites.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
      AND tm.is_active = true
    )
  );

-- RLS Policies for team_activities
CREATE POLICY "Team members can view team activities"
  ON team_activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_activities.team_id
      AND tm.user_id = auth.uid()
      AND tm.is_active = true
    )
  );

CREATE POLICY "Team members can create activities"
  ON team_activities FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_activities.team_id
      AND tm.user_id = auth.uid()
      AND tm.is_active = true
    )
  );

-- RLS Policies for user_presence
CREATE POLICY "Team members can view team presence"
  ON user_presence FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = user_presence.team_id
      AND tm.user_id = auth.uid()
      AND tm.is_active = true
    )
  );

CREATE POLICY "Users can manage their own presence"
  ON user_presence FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for collaborative_edits
CREATE POLICY "Team members can view collaborative edits"
  ON collaborative_edits FOR SELECT
  TO authenticated
  USING (
    -- Check if user is a team member for the resource
    CASE 
      WHEN resource_type = 'property' THEN
        EXISTS (
          SELECT 1 FROM properties p
          JOIN team_members tm ON tm.team_id = p.team_id
          WHERE p.id = collaborative_edits.resource_id::uuid
          AND tm.user_id = auth.uid()
          AND tm.is_active = true
        )
      WHEN resource_type = 'evaluation' THEN
        EXISTS (
          SELECT 1 FROM evaluations e
          JOIN properties p ON p.id = e.property_id
          JOIN team_members tm ON tm.team_id = p.team_id
          WHERE e.id = collaborative_edits.resource_id::uuid
          AND tm.user_id = auth.uid()
          AND tm.is_active = true
        )
      ELSE false
    END
  );

CREATE POLICY "Team members can create collaborative edits"
  ON collaborative_edits FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    CASE 
      WHEN resource_type = 'property' THEN
        EXISTS (
          SELECT 1 FROM properties p
          JOIN team_members tm ON tm.team_id = p.team_id
          WHERE p.id = resource_id::uuid
          AND tm.user_id = auth.uid()
          AND tm.is_active = true
        )
      WHEN resource_type = 'evaluation' THEN
        EXISTS (
          SELECT 1 FROM evaluations e
          JOIN properties p ON p.id = e.property_id
          JOIN team_members tm ON tm.team_id = p.team_id
          WHERE e.id = resource_id::uuid
          AND tm.user_id = auth.uid()
          AND tm.is_active = true
        )
      ELSE false
    END
  );

-- RLS Policies for notification_preferences
CREATE POLICY "Users can manage their own notification preferences"
  ON notification_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_team_invites_updated_at
  BEFORE UPDATE ON team_invites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_presence_updated_at
  BEFORE UPDATE ON user_presence
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired invites
CREATE OR REPLACE FUNCTION cleanup_expired_invites()
RETURNS void AS $$
BEGIN
  UPDATE team_invites 
  SET is_active = false 
  WHERE expires_at < now() AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to update user presence
CREATE OR REPLACE FUNCTION update_user_presence(
  p_user_id uuid,
  p_team_id uuid,
  p_status text DEFAULT 'online',
  p_current_page text DEFAULT NULL,
  p_cursor_position jsonb DEFAULT NULL,
  p_selection jsonb DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_presence (
    user_id, team_id, status, current_page, cursor_position, selection, metadata
  ) VALUES (
    p_user_id, p_team_id, p_status, p_current_page, p_cursor_position, p_selection, p_metadata
  )
  ON CONFLICT (user_id, team_id) 
  DO UPDATE SET
    status = EXCLUDED.status,
    current_page = EXCLUDED.current_page,
    cursor_position = EXCLUDED.cursor_position,
    selection = EXCLUDED.selection,
    metadata = EXCLUDED.metadata,
    last_seen = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;