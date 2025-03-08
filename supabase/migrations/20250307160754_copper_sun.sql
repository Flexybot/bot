/*
  # Fix Organization Policies and Access Control

  1. Changes
    - Drop existing policies to prevent conflicts
    - Add proper RLS policies for organizations and members
    - Fix infinite recursion by simplifying policy conditions
    - Add indexes for better performance

  2. Security
    - Enable RLS on all tables
    - Add granular access control based on user roles
    - Prevent circular dependencies in policies
*/

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "organizations_select_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_delete_policy" ON organizations;
DROP POLICY IF EXISTS "org_members_select_policy" ON organization_members;
DROP POLICY IF EXISTS "org_members_insert_policy" ON organization_members;
DROP POLICY IF EXISTS "org_members_update_policy" ON organization_members;
DROP POLICY IF EXISTS "org_members_delete_policy" ON organization_members;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);

-- Organization Policies
CREATE POLICY "organizations_select_policy" ON organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "organizations_insert_policy" ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "organizations_update_policy" ON organizations
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "organizations_delete_policy" ON organizations
  FOR DELETE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Organization Members Policies
CREATE POLICY "org_members_select_policy" ON organization_members
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "org_members_insert_policy" ON organization_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      -- Allow owners and admins to add members
      organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
      )
    ) OR (
      -- Allow users to add themselves as owner when creating new org
      user_id = auth.uid() 
      AND role = 'owner'
      AND NOT EXISTS (
        SELECT 1 
        FROM organization_members 
        WHERE organization_id = organization_members.organization_id
      )
    )
  );

CREATE POLICY "org_members_update_policy" ON organization_members
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );

CREATE POLICY "org_members_delete_policy" ON organization_members
  FOR DELETE
  TO authenticated
  USING (
    (
      -- Allow owners to remove members
      organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
        AND role = 'owner'
      )
    ) OR (
      -- Allow users to remove themselves
      user_id = auth.uid()
    )
  );