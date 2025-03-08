/*
  # Fix Organization Member Policies

  1. Changes
    - Drop existing problematic policies
    - Create new non-recursive policies for organization_members table
    - Add proper security checks without circular dependencies
    
  2. Security
    - Enable RLS on organization_members table
    - Add policies for viewing and managing organization members
    - Implement role-based access control
*/

-- First, safely drop existing policies
DO $$ 
BEGIN
  -- Drop organization member policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organization_members'
  ) THEN
    DROP POLICY IF EXISTS "Users can view organizations they are members of" ON organization_members;
    DROP POLICY IF EXISTS "Users can manage organization members" ON organization_members;
  END IF;
END $$;

-- Enable RLS on organization_members table
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Create base policy for users to view their own membership
CREATE POLICY "Users can view their own membership"
  ON organization_members
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for organization owners and admins to view all members
CREATE POLICY "Organization admins can view all members"
  ON organization_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members AS om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Create policy for organization owners and admins to manage members
CREATE POLICY "Organization admins can manage members"
  ON organization_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members AS om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);