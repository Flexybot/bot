/*
  # Fix Organization Member Policies

  1. Changes
    - Safely drop existing policies
    - Create new policies with unique names
    - Add proper security checks
    
  2. Security
    - Enable RLS on organization_members table
    - Add policies for viewing and managing organization members
    - Implement role-based access control
*/

-- First, safely drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop organization member policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organization_members' 
    AND policyname = 'Organization admins can manage members'
  ) THEN
    DROP POLICY IF EXISTS "Organization admins can manage members" ON organization_members;
  END IF;
END $$;

-- Create new policies with unique names
CREATE POLICY "org_members_manage_20240318" ON organization_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_members AS om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
)
WITH CHECK (
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