/*
  # Hausee Navigator Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `full_name` (text)
      - `team_invite_code` (text, unique, 8-character alphanumeric)
      - `team_id` (uuid, references teams)
      - `role` (text, 'primary' or 'collaborator')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `teams`
      - `id` (uuid, primary key)
      - `name` (text)
      - `created_by` (uuid, references users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `properties`
      - `id` (uuid, primary key)
      - `team_id` (uuid, references teams)
      - `address` (text)
      - `property_type` (text)
      - `bedrooms` (integer)
      - `bathrooms` (integer)
      - `square_feet` (integer)
      - `lot_size` (numeric)
      - `year_built` (integer)
      - `listing_price` (numeric)
      - `created_by` (uuid, references users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `evaluations`
      - `id` (uuid, primary key)
      - `property_id` (uuid, references properties)
      - `team_id` (uuid, references teams)
      - `estimated_value` (numeric)
      - `confidence_score` (integer, 1-100)
      - `evaluation_notes` (text)
      - `evaluation_date` (timestamp)
      - `created_by` (uuid, references users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `media_files`
      - `id` (uuid, primary key)
      - `property_id` (uuid, references properties)
      - `team_id` (uuid, references teams)
      - `file_name` (text)
      - `file_type` (text)
      - `file_size` (integer)
      - `storage_path` (text)
      - `uploaded_by` (uuid, references users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for team-based data access
    - Ensure users can only access their team's data
*/

-- Create teams table first (referenced by users)
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'My Team',
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create users table with team relationship
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  team_invite_code text UNIQUE NOT NULL,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'primary' CHECK (role IN ('primary', 'collaborator')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  address text NOT NULL,
  property_type text NOT NULL DEFAULT 'residential',
  bedrooms integer DEFAULT 0,
  bathrooms integer DEFAULT 0,
  square_feet integer DEFAULT 0,
  lot_size numeric DEFAULT 0,
  year_built integer DEFAULT 0,
  listing_price numeric DEFAULT 0,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  estimated_value numeric NOT NULL DEFAULT 0,
  confidence_score integer NOT NULL DEFAULT 50 CHECK (confidence_score >= 1 AND confidence_score <= 100),
  evaluation_notes text DEFAULT '',
  evaluation_date timestamptz DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create media_files table
CREATE TABLE IF NOT EXISTS media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL DEFAULT 0,
  storage_path text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_users_team_invite_code ON users(team_invite_code);
CREATE INDEX IF NOT EXISTS idx_properties_team_id ON properties(team_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_property_id ON evaluations(property_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_team_id ON evaluations(team_id);
CREATE INDEX IF NOT EXISTS idx_media_files_property_id ON media_files(property_id);
CREATE INDEX IF NOT EXISTS idx_media_files_team_id ON media_files(team_id);

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Users can read their own team"
  ON teams FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR 
    id IN (SELECT team_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can create teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Team creators can update their teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Users policies
CREATE POLICY "Users can read team members"
  ON users FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR 
    team_id IN (SELECT team_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Properties policies
CREATE POLICY "Team members can read team properties"
  ON properties FOR SELECT
  TO authenticated
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Team members can create properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IN (SELECT team_id FROM users WHERE id = auth.uid()) AND
    created_by = auth.uid()
  );

CREATE POLICY "Team members can update team properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()))
  WITH CHECK (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Team members can delete team properties"
  ON properties FOR DELETE
  TO authenticated
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

-- Evaluations policies
CREATE POLICY "Team members can read team evaluations"
  ON evaluations FOR SELECT
  TO authenticated
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Team members can create evaluations"
  ON evaluations FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IN (SELECT team_id FROM users WHERE id = auth.uid()) AND
    created_by = auth.uid()
  );

CREATE POLICY "Team members can update team evaluations"
  ON evaluations FOR UPDATE
  TO authenticated
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()))
  WITH CHECK (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Team members can delete team evaluations"
  ON evaluations FOR DELETE
  TO authenticated
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

-- Media files policies
CREATE POLICY "Team members can read team media files"
  ON media_files FOR SELECT
  TO authenticated
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Team members can upload media files"
  ON media_files FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IN (SELECT team_id FROM users WHERE id = auth.uid()) AND
    uploaded_by = auth.uid()
  );

CREATE POLICY "Team members can delete team media files"
  ON media_files FOR DELETE
  TO authenticated
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

-- Function to generate unique team invite codes
CREATE OR REPLACE FUNCTION generate_team_invite_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
  code_exists boolean := true;
BEGIN
  WHILE code_exists LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    SELECT EXISTS(SELECT 1 FROM users WHERE team_invite_code = result) INTO code_exists;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO users (id, email, team_invite_code)
  VALUES (
    NEW.id,
    NEW.email,
    generate_team_invite_code()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();