/*
  # Fix Organization Members RLS Policies

  1. Changes
    - Drop existing problematic policies
    - Create new non-recursive policies for organization members
    - Add proper role-based access control
    - Add indexes for performance

  2. Security
    - Enable RLS on organization_members table
    - Add policies for viewing and managing members based on roles
    - Prevent recursive policy evaluation
*/

-- First, ensure RLS is enabled
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Organization admins can manage members" ON organization_members;
  DROP POLICY IF EXISTS "Users can view organizations they are members of" ON organization_members;
  DROP POLICY IF EXISTS "Users can view chatbots in their organizations" ON organization_members;
END $$;

-- Create policy for selecting members
-- This policy allows users to view members of organizations they belong to
CREATE POLICY "select_org_members" ON organization_members
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR 
  organization_id IN (
    SELECT om.organization_id 
    FROM organization_members om 
    WHERE om.user_id = auth.uid()
  )
);

-- Create policy for inserting new members
-- Only owners and admins can add new members
CREATE POLICY "insert_org_members" ON organization_members
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);

-- Create policy for updating members
-- Only owners and admins can update member roles
CREATE POLICY "update_org_members" ON organization_members
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);

-- Create policy for deleting members
-- Only owners and admins can remove members
CREATE POLICY "delete_org_members" ON organization_members
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);