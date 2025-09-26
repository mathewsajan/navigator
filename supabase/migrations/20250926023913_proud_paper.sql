/*
  # Create evaluations table for property assessments

  1. New Tables
    - `evaluations`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key to properties)
      - `team_id` (uuid, foreign key to teams)
      - `evaluator_id` (uuid, foreign key to users)
      - `evaluator_name` (text, cached for performance)
      - Rating fields for each category (1=Poor, 2=Fair, 3=Good)
      - Notes fields for each category
      - `completion_percentage` (integer, 0-100)
      - `is_complete` (boolean)
      - `last_saved_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `evaluations` table
    - Add policies for team-based access control
    - Users can only access evaluations for their team's properties

  3. Indexes
    - Add indexes for efficient querying by property and team
    - Add index for completion status filtering
*/

-- Create evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  evaluator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  evaluator_name text NOT NULL,
  
  -- Rating categories (1 = Poor, 2 = Fair, 3 = Good, NULL = Not rated)
  curb_appeal_rating integer CHECK (curb_appeal_rating IN (1, 2, 3)),
  curb_appeal_notes text DEFAULT '',
  
  entryway_driveway_rating integer CHECK (entryway_driveway_rating IN (1, 2, 3)),
  entryway_driveway_notes text DEFAULT '',
  
  backyard_rating integer CHECK (backyard_rating IN (1, 2, 3)),
  backyard_notes text DEFAULT '',
  
  interior_spaces_rating integer CHECK (interior_spaces_rating IN (1, 2, 3)),
  interior_spaces_notes text DEFAULT '',
  
  overall_condition_rating integer CHECK (overall_condition_rating IN (1, 2, 3)),
  overall_condition_notes text DEFAULT '',
  
  -- Metadata
  completion_percentage integer DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  is_complete boolean DEFAULT false,
  last_saved_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_evaluations_property_id ON evaluations(property_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_team_id ON evaluations(team_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator_id ON evaluations(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_completion ON evaluations(is_complete, completion_percentage);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_evaluations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_evaluations_updated_at();

-- RLS Policies

-- Users can view evaluations for properties in their team
CREATE POLICY "Users can view team evaluations"
  ON evaluations
  FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id 
      FROM users 
      WHERE id = auth.uid() 
      AND team_id IS NOT NULL
    )
  );

-- Users can create evaluations for properties in their team
CREATE POLICY "Users can create team evaluations"
  ON evaluations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IN (
      SELECT team_id 
      FROM users 
      WHERE id = auth.uid() 
      AND team_id IS NOT NULL
    )
    AND evaluator_id = auth.uid()
  );

-- Users can update their own evaluations within their team
CREATE POLICY "Users can update own evaluations"
  ON evaluations
  FOR UPDATE
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id 
      FROM users 
      WHERE id = auth.uid() 
      AND team_id IS NOT NULL
    )
    AND evaluator_id = auth.uid()
  )
  WITH CHECK (
    team_id IN (
      SELECT team_id 
      FROM users 
      WHERE id = auth.uid() 
      AND team_id IS NOT NULL
    )
    AND evaluator_id = auth.uid()
  );

-- Users can delete their own evaluations within their team
CREATE POLICY "Users can delete own evaluations"
  ON evaluations
  FOR DELETE
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id 
      FROM users 
      WHERE id = auth.uid() 
      AND team_id IS NOT NULL
    )
    AND evaluator_id = auth.uid()
  );

-- Primary users can delete any evaluation in their team
CREATE POLICY "Primary users can delete team evaluations"
  ON evaluations
  FOR DELETE
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id 
      FROM users 
      WHERE id = auth.uid() 
      AND team_id IS NOT NULL 
      AND role = 'primary'
    )
  );