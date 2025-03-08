/*
  # Fix Organization RLS Policies

  1. Changes
    - Drop existing problematic RLS policies
    - Create new, optimized RLS policies for organization_members table
    - Add proper access control based on user roles
  
  2. Security
    - Enable RLS on organization_members table
    - Add policies for:
      - Select: Users can read organizations they are members of
      - Insert: Users can only add members if they are admins/owners
      - Update: Users can only update their own role if they are admins/owners
      - Delete: Only admins/owners can remove members
*/

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own organizations" ON organization_members;
DROP POLICY IF EXISTS "Users can manage their own organizations" ON organization_members;

-- Create new policies
CREATE POLICY "Users can view organizations they belong to"
  ON organization_members
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Organization admins can add members"
  ON organization_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_members.organization_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Organization admins can update members"
  ON organization_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_members.organization_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_members.organization_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Organization admins can delete members"
  ON organization_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_members.organization_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );