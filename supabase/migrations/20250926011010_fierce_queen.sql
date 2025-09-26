/*
  # Hausee Navigator - Complete Database Schema
  
  ## Overview
  This migration creates a comprehensive database schema for Hausee Navigator,
  a team-based property evaluation application with real-time collaboration.
  
  ## Key Features
  1. Team Management
     - Primary user can invite up to 2 collaborators (3 total per team)
     - 8-character invite codes for team joining
     - Complete team data isolation via RLS
  
  2. Property Management
     - Duplicate prevention by exact address matching within teams
     - Comprehensive property details and specifications
     - Team-scoped with duplicate prevention by address
     - Optimized for search and filtering
  
  3. Evaluation System
     - 10 predefined evaluation categories
     - Good/Fair/Poor rating system (3/2/1 scoring)
     - Individual user evaluations with real-time updates
  
  4. Media Management
     - Thumbnail storage in database (bytea)
     - External file references (Supabase Storage)
     - Team-scoped media access
  
  5. Checklist Progress Tracking
     - Create and manage checklists for properties
     - Track completion status and who completed items
  
  6. Security & Performance
     - Row Level Security (RLS) on all tables
     - Strategic indexing for search and real-time queries
     - Optimized for Supabase real-time subscriptions
     - Database triggers for data integrity and automation
*/

-- Enable required extensions for UUID generation and fuzzy text search
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For efficient LIKE queries on text fields

-- Set up a custom schema for application data to keep it separate from public
-- This is good practice for larger applications, though 'public' is often used.
-- For this example, we'll stick to 'public' as it's common in Supabase.

-- =====================================================
-- SECTION 1: SCHEMA CREATION (TABLES, RELATIONSHIPS, CONSTRAINTS)
-- =====================================================

/*
  Table: user_profiles
  Description: Stores extended user information beyond auth.users.
  Relationships: One-to-one with auth.users.
*/
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text CHECK (length(full_name) >= 2 AND length(full_name) <= 100),
  avatar_url text,
  
  -- User preferences
  timezone text DEFAULT 'America/Toronto',
  notification_preferences jsonb DEFAULT '{"email": true, "push": true, "realtime": true}'::jsonb,
  
  -- Activity tracking
  last_active_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT user_profiles_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

/*
  Table: teams
  Description: Manages team creation and invite codes.
  Constraints:
    - `invite_code` is unique and 8 characters long.
    - `name` is between 2 and 100 characters.
    - `max_members` defaults to 3 and is between 1 and 3.
  Relationships: `created_by` links to `auth.users`.
*/
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  invite_code text UNIQUE NOT NULL CHECK (length(invite_code) = 8),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Team settings
  max_members integer DEFAULT 3 CHECK (max_members > 0 AND max_members <= 3),
  is_active boolean DEFAULT true,
  
  -- Metadata
  description text CHECK (length(description) <= 500),
  
  CONSTRAINT teams_name_not_empty CHECK (trim(name) != '')
);

/*
  Table: team_members
  Description: Links users to teams with roles.
  Constraints:
    - `user_id` and `team_id` form a unique pair (no duplicate memberships).
    - `role` can only be 'owner' or 'member'.
    - Ensures only one 'owner' per team.
  Relationships: Links to `teams` and `auth.users`.
*/
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  
  -- Prevent duplicate memberships
  UNIQUE(team_id, user_id),
  
  -- Ensure only one owner per team (using a partial unique index/constraint)
  -- This constraint ensures that for any given team_id, there can be at most one row where role is 'owner'.
  EXCLUDE (team_id WITH =) WHERE (role = 'owner' AND is_active = true)
);

/*
  Table: properties
  Description: Stores core property information.
  Constraints:
    - `address`, `city`, `postal_code` are unique within a `team_id` to prevent duplicates.
    - Various checks for numeric and text fields.
    - `listing_url` format validation.
  Relationships: Links to `teams` and `auth.users`.
*/
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  
  -- Core property details
  address text NOT NULL CHECK (length(trim(address)) >= 10),
  city text NOT NULL CHECK (length(trim(city)) >= 2),
  province text NOT NULL DEFAULT 'ON' CHECK (length(province) = 2), -- Assuming Canadian provinces, e.g., 'ON', 'QC', 'BC'
  postal_code text NOT NULL CHECK (postal_code ~* '^[A-Z]\d[A-Z]\s?\d[A-Z]\d$'), -- Canadian postal code format
  
  -- Property specifications
  listing_price decimal(12,2) CHECK (listing_price >= 0),
  property_type text NOT NULL DEFAULT 'house' CHECK (property_type IN (
    'house', 'condo', 'townhouse', 'duplex', 'apartment', 'land', 'commercial', 'other'
  )),
  bedrooms integer CHECK (bedrooms >= 0 AND bedrooms <= 20),
  bathrooms decimal(3,1) CHECK (bathrooms >= 0 AND bathrooms <= 20),
  square_feet integer CHECK (square_feet >= 0),
  lot_size_sqft integer CHECK (lot_size_sqft >= 0),
  year_built integer CHECK (year_built >= 1800 AND year_built <= EXTRACT(YEAR FROM now()) + 2),
  
  -- Additional details
  mls_number text CHECK (length(mls_number) <= 20),
  listing_url text,
  notes text CHECK (length(notes) <= 2000),
  
  -- Status and metadata
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'sold', 'removed', 'pending')),
  visit_date date,
  is_favorite boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Prevent duplicate addresses within the same team
  UNIQUE(team_id, address, city, postal_code),
  
  -- Ensure valid URL format if provided
  CONSTRAINT properties_listing_url_format CHECK (
    listing_url IS NULL OR listing_url ~* '^https?://[^\s/$.?#].[^\s]*$'
  )
);

/*
  Table: evaluation_categories
  Description: Predefined categories for property evaluation.
  Constraints: `name` is unique.
  Note: This table is public and not team-scoped.
*/
CREATE TABLE IF NOT EXISTS evaluation_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL CHECK (length(trim(name)) >= 2 AND length(name) <= 100),
  description text CHECK (length(description) <= 500),
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  icon text, -- For UI display (e.g., Lucide icon name)
  
  created_at timestamptz DEFAULT now()
);

/*
  Table: property_evaluations
  Description: Stores individual user evaluations for each property category.
  Constraints:
    - `rating` can only be 'good', 'fair', or 'poor'.
    - `score` is automatically set based on `rating` (1, 2, or 3).
    - Unique constraint to prevent duplicate evaluations per user/property/category.
  Relationships: Links to `properties`, `auth.users`, and `evaluation_categories`.
*/
CREATE TABLE IF NOT EXISTS property_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES evaluation_categories(id) ON DELETE CASCADE,
  
  -- Evaluation data
  rating text NOT NULL CHECK (rating IN ('good', 'fair', 'poor')),
  score integer NOT NULL CHECK (score IN (1, 2, 3)), -- poor=1, fair=2, good=3
  notes text CHECK (length(notes) <= 1000),
  
  -- Metadata
  evaluated_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Prevent duplicate evaluations per user/property/category
  UNIQUE(property_id, user_id, category_id)
);

/*
  Table: property_media
  Description: Stores metadata and thumbnails for media files.
  Constraints:
    - `file_type` can be 'image', 'video', or 'document'.
    - `sync_status` tracks upload progress.
  Relationships: Links to `properties` and `auth.users`.
*/
CREATE TABLE IF NOT EXISTS property_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  
  -- File information
  file_name text NOT NULL CHECK (length(trim(file_name)) > 0),
  file_type text NOT NULL CHECK (file_type IN ('image', 'video', 'document')),
  mime_type text NOT NULL,
  file_size bigint CHECK (file_size >= 0), -- Can be 0 for some metadata-only entries
  
  -- Storage references
  external_url text, -- URL to the full file in Supabase Storage
  thumbnail_data bytea, -- Thumbnail stored directly in the database (for small images)
  thumbnail_mime_type text,
  
  -- Sync and status
  sync_status text DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  is_local_only boolean DEFAULT true, -- True if full file is only on device, false if uploaded to storage
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure valid URL format if provided
  CONSTRAINT property_media_external_url_format CHECK (
    external_url IS NULL OR external_url ~* '^https?://[^\s/$.?#].[^\s]*$'
  )
);

/*
  Table: checklists
  Description: Stores checklists associated with properties.
  Relationships: Links to `properties` and `auth.users`.
*/
CREATE TABLE IF NOT EXISTS checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  
  name text NOT NULL CHECK (length(trim(name)) >= 2 AND length(name) <= 200),
  description text CHECK (length(description) <= 1000),
  
  is_completed boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

/*
  Table: checklist_items
  Description: Stores individual items within a checklist.
  Relationships: Links to `checklists` and `auth.users`.
*/
CREATE TABLE IF NOT EXISTS checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  
  description text NOT NULL CHECK (length(trim(description)) >= 2 AND length(description) <= 500),
  is_completed boolean DEFAULT false,
  completed_by uuid REFERENCES auth.users(id), -- Who completed the item
  completed_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);


-- =====================================================
-- SECTION 2: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_categories ENABLE ROW LEVEL SECURITY; -- Public read-only
ALTER TABLE property_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- Policy for `user_profiles`: Users can only see and modify their own profile.
DROP POLICY IF EXISTS "Users can view their own profile." ON user_profiles;
CREATE POLICY "Users can view their own profile." ON user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile." ON user_profiles;
CREATE POLICY "Users can update their own profile." ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy for `teams`:
-- Authenticated users can create teams.
DROP POLICY IF EXISTS "Authenticated users can create teams." ON teams;
CREATE POLICY "Authenticated users can create teams." ON teams
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Team members can view their team's details.
DROP POLICY IF EXISTS "Team members can view their team." ON teams;
CREATE POLICY "Team members can view their team." ON teams
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_id = teams.id AND user_id = auth.uid())
  );

-- Team owners can update their team's details.
DROP POLICY IF EXISTS "Team owners can update their team." ON teams;
CREATE POLICY "Team owners can update their team." ON teams
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_id = teams.id AND user_id = auth.uid() AND role = 'owner')
  );

-- Team owners can delete their team.
DROP POLICY IF EXISTS "Team owners can delete their team." ON teams;
CREATE POLICY "Team owners can delete their team." ON teams
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_id = teams.id AND user_id = auth.uid() AND role = 'owner')
  );

-- Policy for `team_members`:
-- Authenticated users can insert themselves into a team if they have the invite code (handled by application logic).
-- This policy allows any authenticated user to insert a new team_member record.
-- The trigger `enforce_team_member_limit` will prevent exceeding the max_members.
DROP POLICY IF EXISTS "Authenticated users can join a team." ON team_members;
CREATE POLICY "Authenticated users can join a team." ON team_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Team members can view other members of their team.
DROP POLICY IF EXISTS "Team members can view their team members." ON team_members;
CREATE POLICY "Team members can view their team members." ON team_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid())
  );

-- Team owners can update team member roles or status.
DROP POLICY IF EXISTS "Team owners can update team members." ON team_members;
CREATE POLICY "Team owners can update team members." ON team_members
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid() AND tm.role = 'owner')
  );

-- Team owners can remove team members.
DROP POLICY IF EXISTS "Team owners can delete team members." ON team_members;
CREATE POLICY "Team owners can delete team members." ON team_members
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid() AND tm.role = 'owner')
    AND team_members.user_id != auth.uid() -- Prevent owner from deleting themselves directly
  );

-- Policy for `properties`:
-- Team members can create properties for their team.
DROP POLICY IF EXISTS "Team members can create properties." ON properties;
CREATE POLICY "Team members can create properties." ON properties
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE team_id = properties.team_id AND user_id = auth.uid())
  );

-- Team members can view properties belonging to their team.
DROP POLICY IF EXISTS "Team members can view properties." ON properties;
CREATE POLICY "Team members can view properties." ON properties
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_id = properties.team_id AND user_id = auth.uid())
  );

-- Team members can update properties belonging to their team.
DROP POLICY IF EXISTS "Team members can update properties." ON properties;
CREATE POLICY "Team members can update properties." ON properties
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_id = properties.team_id AND user_id = auth.uid())
  );

-- Team members can delete properties belonging to their team.
DROP POLICY IF EXISTS "Team members can delete properties." ON properties;
CREATE POLICY "Team members can delete properties." ON properties
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_id = properties.team_id AND user_id = auth.uid())
  );

-- Policy for `evaluation_categories`: Public read-only.
DROP POLICY IF EXISTS "Public can view evaluation categories." ON evaluation_categories;
CREATE POLICY "Public can view evaluation categories." ON evaluation_categories
  FOR SELECT USING (true);

-- Policy for `property_evaluations`:
-- Team members can create evaluations for properties in their team.
DROP POLICY IF EXISTS "Team members can create property evaluations." ON property_evaluations;
CREATE POLICY "Team members can create property evaluations." ON property_evaluations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_evaluations.property_id AND EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid()))
    AND auth.uid() = user_id -- Ensure user is evaluating for themselves
  );

-- Team members can view all evaluations for properties in their team.
DROP POLICY IF EXISTS "Team members can view property evaluations." ON property_evaluations;
CREATE POLICY "Team members can view property evaluations." ON property_evaluations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_evaluations.property_id AND EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid()))
  );

-- Team members can update their own evaluations for properties in their team.
DROP POLICY IF EXISTS "Team members can update their own property evaluations." ON property_evaluations;
CREATE POLICY "Team members can update their own property evaluations." ON property_evaluations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_evaluations.property_id AND EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid()))
    AND auth.uid() = user_id
  );

-- Team members can delete their own evaluations for properties in their team.
DROP POLICY IF EXISTS "Team members can delete their own property evaluations." ON property_evaluations;
CREATE POLICY "Team members can delete their own property evaluations." ON property_evaluations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_evaluations.property_id AND EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid()))
    AND auth.uid() = user_id
  );

-- Policy for `property_media`:
-- Team members can upload media for properties in their team.
DROP POLICY IF EXISTS "Team members can upload property media." ON property_media;
CREATE POLICY "Team members can upload property media." ON property_media
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_media.property_id AND EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid()))
    AND auth.uid() = uploaded_by
  );

-- Team members can view media for properties in their team.
DROP POLICY IF EXISTS "Team members can view property media." ON property_media;
CREATE POLICY "Team members can view property media." ON property_media
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_media.property_id AND EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid()))
  );

-- Team members can update their own uploaded media for properties in their team.
DROP POLICY IF EXISTS "Team members can update their own property media." ON property_media;
CREATE POLICY "Team members can update their own property media." ON property_media
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_media.property_id AND EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid()))
    AND auth.uid() = uploaded_by
  );

-- Team members can delete their own uploaded media for properties in their team.
DROP POLICY IF EXISTS "Team members can delete their own property media." ON property_media;
CREATE POLICY "Team members can delete their own property media." ON property_media
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_media.property_id AND EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid()))
    AND auth.uid() = uploaded_by
  );

-- Policy for `checklists`:
-- Team members can create checklists for properties in their team.
DROP POLICY IF EXISTS "Team members can create checklists." ON checklists;
CREATE POLICY "Team members can create checklists." ON checklists
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = checklists.property_id AND EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid()))
    AND auth.uid() = created_by
  );

-- Team members can view checklists for properties in their team.
DROP POLICY IF EXISTS "Team members can view checklists." ON checklists;
CREATE POLICY "Team members can view checklists." ON checklists
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = checklists.property_id AND EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid()))
  );

-- Team members can update checklists for properties in their team.
DROP POLICY IF EXISTS "Team members can update checklists." ON checklists;
CREATE POLICY "Team members can update checklists." ON checklists
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = checklists.property_id AND EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid()))
  );

-- Team members can delete checklists for properties in their team.
DROP POLICY IF EXISTS "Team members can delete checklists." ON checklists;
CREATE POLICY "Team members can delete checklists." ON checklists
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = checklists.property_id AND EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid()))
  );

-- Policy for `checklist_items`:
-- Team members can create checklist items for checklists in their team.
DROP POLICY IF EXISTS "Team members can create checklist items." ON checklist_items;
CREATE POLICY "Team members can create checklist items." ON checklist_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_items.checklist_id AND EXISTS (SELECT 1 FROM properties p WHERE p.id = c.property_id AND EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid())))
  );

-- Team members can view checklist items for checklists in their team.
DROP POLICY IF EXISTS "Team members can view checklist items." ON checklist_items;
CREATE POLICY "Team members can view checklist items." ON checklist_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_items.checklist_id AND EXISTS (SELECT 1 FROM properties p WHERE p.id = c.property_id AND EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid())))
  );

-- Team members can update checklist items for checklists in their team.
DROP POLICY IF EXISTS "Team members can update checklist items." ON checklist_items;
CREATE POLICY "Team members can update checklist items." ON checklist_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_items.checklist_id AND EXISTS (SELECT 1 FROM properties p WHERE p.id = c.property_id AND EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid())))
  );

-- Team members can delete checklist items for checklists in their team.
DROP POLICY IF EXISTS "Team members can delete checklist items." ON checklist_items;
CREATE POLICY "Team members can delete checklist items." ON checklist_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_items.checklist_id AND EXISTS (SELECT 1 FROM properties p WHERE p.id = c.property_id AND EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid())))
  );


-- =====================================================
-- SECTION 3: PERFORMANCE OPTIMIZATION (INDEXES, TRIGGERS)
-- =====================================================

-- Indexes for `user_profiles`
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles (email);

-- Indexes for `teams`
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams (created_by);
CREATE INDEX IF NOT EXISTS idx_teams_name_trgm ON teams USING GIN (name gin_trgm_ops); -- For fuzzy search on team names

-- Indexes for `team_members`
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members (team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members (user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_user_active ON team_members (team_id, user_id, is_active);

-- Indexes for `properties`
CREATE INDEX IF NOT EXISTS idx_properties_team_id ON properties (team_id);
CREATE INDEX IF NOT EXISTS idx_properties_created_by ON properties (created_by);
CREATE INDEX IF NOT EXISTS idx_properties_team_status ON properties (team_id, status);
CREATE INDEX IF NOT EXISTS idx_properties_team_visit_date ON properties (team_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_properties_address_trgm ON properties USING GIN (address gin_trgm_ops); -- For fuzzy search on addresses
CREATE INDEX IF NOT EXISTS idx_properties_city_trgm ON properties USING GIN (city gin_trgm_ops); -- For fuzzy search on cities

-- Indexes for `evaluation_categories`
CREATE INDEX IF NOT EXISTS idx_evaluation_categories_display_order ON evaluation_categories (display_order);

-- Indexes for `property_evaluations`
CREATE INDEX IF NOT EXISTS idx_property_evaluations_property_id ON property_evaluations (property_id);
CREATE INDEX IF NOT EXISTS idx_property_evaluations_user_id ON property_evaluations (user_id);
CREATE INDEX IF NOT EXISTS idx_property_evaluations_category_id ON property_evaluations (category_id);
CREATE INDEX IF NOT EXISTS idx_property_evaluations_property_category ON property_evaluations (property_id, category_id);

-- Indexes for `property_media`
CREATE INDEX IF NOT EXISTS idx_property_media_property_id ON property_media (property_id);
CREATE INDEX IF NOT EXISTS idx_property_media_uploaded_by ON property_media (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_property_media_property_file_type ON property_media (property_id, file_type);
CREATE INDEX IF NOT EXISTS idx_property_media_sync_status ON property_media (sync_status);

-- Indexes for `checklists`
CREATE INDEX IF NOT EXISTS idx_checklists_property_id ON checklists (property_id);
CREATE INDEX IF NOT EXISTS idx_checklists_created_by ON checklists (created_by);
CREATE INDEX IF NOT EXISTS idx_checklists_property_completed ON checklists (property_id, is_completed);

-- Indexes for `checklist_items`
CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist_id ON checklist_items (checklist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_completed_by ON checklist_items (completed_by);
CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist_completed ON checklist_items (checklist_id, is_completed);


-- Triggers for automatic `updated_at` timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_property_evaluations_updated_at BEFORE UPDATE ON property_evaluations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_property_media_updated_at BEFORE UPDATE ON property_media FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_checklists_updated_at BEFORE UPDATE ON checklists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_checklist_items_updated_at BEFORE UPDATE ON checklist_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Trigger to create a user_profile entry when a new user signs up via auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Trigger to set the score based on the rating in `property_evaluations`
CREATE OR REPLACE FUNCTION set_evaluation_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating = 'good' THEN
    NEW.score = 3;
  ELSIF NEW.rating = 'fair' THEN
    NEW.score = 2;
  ELSIF NEW.rating = 'poor' THEN
    NEW.score = 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_evaluation_score_trigger
BEFORE INSERT OR UPDATE ON property_evaluations
FOR EACH ROW EXECUTE FUNCTION set_evaluation_score();


-- Trigger to enforce the maximum number of team members
CREATE OR REPLACE FUNCTION enforce_team_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_members integer;
  max_allowed integer;
BEGIN
  SELECT max_members INTO max_allowed FROM teams WHERE id = NEW.team_id;
  SELECT COUNT(*) INTO current_members FROM team_members WHERE team_id = NEW.team_id AND is_active = TRUE;
  
  IF current_members >= max_allowed THEN
    RAISE EXCEPTION 'Team has reached its maximum number of members (%).', max_allowed;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_team_member_limit_trigger
BEFORE INSERT ON team_members
FOR EACH ROW EXECUTE FUNCTION enforce_team_member_limit();


-- Trigger to automatically assign the 'owner' role to the user who creates a team
CREATE OR REPLACE FUNCTION assign_team_owner_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER assign_team_owner_role_trigger
AFTER INSERT ON teams
FOR EACH ROW EXECUTE FUNCTION assign_team_owner_role();


-- =====================================================
-- SECTION 4: INITIAL DATA (EVALUATION CATEGORIES)
-- =====================================================

-- Insert initial evaluation categories
INSERT INTO evaluation_categories (name, description, display_order, icon) VALUES
('Exterior', 'Overall condition of the building exterior, roof, siding, windows.', 1, 'Home'),
('Interior', 'General condition of walls, floors, ceilings, and fixtures.', 2, 'Layout'),
('Kitchen', 'Condition of appliances, cabinets, countertops, and plumbing.', 3, 'CookingPot'),
('Bathrooms', 'Condition of fixtures, plumbing, tiling, and ventilation.', 4, 'ShowerHead'),
('Bedrooms', 'Size, natural light, closet space, and overall comfort.', 5, 'Bed'),
('Basement/Foundation', 'Structural integrity, signs of water damage, and usability.', 6, 'Building'),
('HVAC', 'Heating, ventilation, and air conditioning system condition and age.', 7, 'Fan'),
('Plumbing', 'Water pressure, pipe condition, and hot water heater.', 8, 'Faucet'),
('Electrical', 'Panel condition, wiring, outlets, and lighting.', 9, 'Lightbulb'),
('Yard/Landscaping', 'Condition of the yard, fencing, drainage, and outdoor features.', 10, 'Trees')
ON CONFLICT (name) DO NOTHING;


-- =====================================================
-- SECTION 5: SAMPLE QUERIES (FOR VERIFICATION)
-- =====================================================

/*
  -- IMPORTANT: These sample queries assume you have authenticated users
  -- and have set up the RLS policies correctly.
  -- You will need to replace UUIDs with actual values from your database.
*/

-- 1. Get a user's profile
-- SELECT * FROM user_profiles WHERE id = 'YOUR_AUTH_USER_ID';

-- 2. Get teams a user belongs to
-- SELECT
--   t.id AS team_id,
--   t.name AS team_name,
--   tm.role
-- FROM
--   teams t
-- JOIN
--   team_members tm ON t.id = tm.team_id
-- WHERE
--   tm.user_id = 'YOUR_AUTH_USER_ID';

-- 3. Get all members of a specific team
-- SELECT
--   up.full_name,
--   up.email,
--   tm.role
-- FROM
--   team_members tm
-- JOIN
--   user_profiles up ON tm.user_id = up.id
-- WHERE
--   tm.team_id = 'YOUR_TEAM_ID';

-- 4. Get all properties for a specific team
-- SELECT * FROM properties WHERE team_id = 'YOUR_TEAM_ID';

-- 5. Get a specific property's details along with its team name
-- SELECT
--   p.*,
--   t.name AS team_name
-- FROM
--   properties p
-- JOIN
--   teams t ON p.team_id = t.id
-- WHERE
--   p.id = 'YOUR_PROPERTY_ID';

-- 6. Get all evaluations for a specific property, including user and category details
-- SELECT
--   pe.rating,
--   pe.score,
--   pe.notes,
--   up.full_name AS evaluator_name,
--   ec.name AS category_name
-- FROM
--   property_evaluations pe
-- JOIN
--   user_profiles up ON pe.user_id = up.id
-- JOIN
--   evaluation_categories ec ON pe.category_id = ec.id
-- WHERE
--   pe.property_id = 'YOUR_PROPERTY_ID';

-- 7. Get all media (thumbnails) for a specific property
-- SELECT
--   pm.file_name,
--   pm.file_type,
--   pm.external_url,
--   pm.thumbnail_data, -- Be cautious with large bytea data in direct selects
--   up.full_name AS uploader_name
-- FROM
--   property_media pm
-- JOIN
--   user_profiles up ON pm.uploaded_by = up.id
-- WHERE
--   pm.property_id = 'YOUR_PROPERTY_ID';

-- 8. Get all checklists and their items for a specific property
-- SELECT
--   c.name AS checklist_name,
--   c.description AS checklist_description,
--   ci.description AS item_description,
--   ci.is_completed,
--   up.full_name AS completed_by_name
-- FROM
--   checklists c
-- JOIN
--   checklist_items ci ON c.id = ci.checklist_id
-- LEFT JOIN
--   user_profiles up ON ci.completed_by = up.id
-- WHERE
--   c.property_id = 'YOUR_PROPERTY_ID'
-- ORDER BY
--   c.created_at, ci.created_at;

-- 9. Search for properties by address within a team (using pg_trgm index)
-- SELECT *
-- FROM properties
-- WHERE team_id = 'YOUR_TEAM_ID'
--   AND address ILIKE '%main street%'
-- ORDER BY
--   similarity(address, 'main street') DESC;

-- 10. Calculate average evaluation score for a property across all categories and users
-- SELECT
--   p.address,
--   AVG(pe.score) AS average_score
-- FROM
--   properties p
-- JOIN
--   property_evaluations pe ON p.id = pe.property_id
-- WHERE
--   p.id = 'YOUR_PROPERTY_ID'
-- GROUP BY
--   p.address;

-- 11. Get properties with incomplete checklists for a team
-- SELECT DISTINCT
--   p.id,
--   p.address
-- FROM
--   properties p
-- JOIN
--   checklists c ON p.id = c.property_id
-- JOIN
--   checklist_items ci ON c.id = ci.checklist_id
-- WHERE
--   p.team_id = 'YOUR_TEAM_ID' AND ci.is_completed = FALSE;