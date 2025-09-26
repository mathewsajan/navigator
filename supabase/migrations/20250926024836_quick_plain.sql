/*
  # Create property media table

  1. New Tables
    - `property_media`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key to properties)
      - `uploaded_by` (uuid, foreign key to users)
      - `file_name` (text)
      - `file_type` (text) - 'image' or 'video'
      - `mime_type` (text)
      - `file_size` (bigint)
      - `thumbnail_data` (bytea) - base64 encoded thumbnail
      - `thumbnail_mime_type` (text)
      - `external_url` (text, optional)
      - `sync_status` (text) - 'pending', 'synced', 'failed'
      - `is_local_only` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `property_media` table
    - Add policies for team members to manage media for their properties
    - Add indexes for performance

  3. Functions
    - Add trigger for updated_at timestamp
*/

-- Create property_media table
CREATE TABLE IF NOT EXISTS property_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES users(id),
  file_name text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('image', 'video')),
  mime_type text NOT NULL,
  file_size bigint CHECK (file_size >= 0),
  thumbnail_data bytea,
  thumbnail_mime_type text,
  external_url text,
  sync_status text DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  is_local_only boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_property_media_property_id ON property_media(property_id);
CREATE INDEX IF NOT EXISTS idx_property_media_uploaded_by ON property_media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_property_media_sync_status ON property_media(sync_status);
CREATE INDEX IF NOT EXISTS idx_property_media_property_file_type ON property_media(property_id, file_type);

-- Enable RLS
ALTER TABLE property_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Team members can view property media"
  ON property_media
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_media.property_id
      AND EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = p.team_id
        AND tm.user_id = uid()
      )
    )
  );

CREATE POLICY "Team members can upload property media"
  ON property_media
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_media.property_id
      AND EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = p.team_id
        AND tm.user_id = uid()
      )
    )
    AND uid() = uploaded_by
  );

CREATE POLICY "Team members can update their own property media"
  ON property_media
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_media.property_id
      AND EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = p.team_id
        AND tm.user_id = uid()
      )
    )
    AND uid() = uploaded_by
  );

CREATE POLICY "Team members can delete their own property media"
  ON property_media
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_media.property_id
      AND EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = p.team_id
        AND tm.user_id = uid()
      )
    )
    AND uid() = uploaded_by
  );

-- Add constraints
ALTER TABLE property_media ADD CONSTRAINT property_media_file_name_check 
  CHECK (length(trim(file_name)) > 0);

ALTER TABLE property_media ADD CONSTRAINT property_media_file_size_check 
  CHECK (file_size >= 0);

ALTER TABLE property_media ADD CONSTRAINT property_media_external_url_format 
  CHECK (external_url IS NULL OR external_url ~* '^https?://[^\s/$.?#].[^\s]*$');

-- Add updated_at trigger
CREATE TRIGGER update_property_media_updated_at
  BEFORE UPDATE ON property_media
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();