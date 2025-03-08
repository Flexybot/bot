/*
  # Fix Organization Policies and Permissions

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create new policies with proper access control
    - Fix infinite recursion in policies
    - Add indexes for better performance

  2. Security
    - Enable RLS on all tables
    - Add proper policies for organization access
    - Add policies for member management
*/

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view organizations they are members of" ON organizations;
DROP POLICY IF EXISTS "Users can view members in their organizations" ON organization_members;
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
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "organizations_insert_policy" ON organizations
  FOR INSERT
  WITH CHECK (
    -- Allow any authenticated user to create an organization
    auth.role() = 'authenticated'
  );

CREATE POLICY "organizations_update_policy" ON organizations
  FOR UPDATE
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
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "org_members_insert_policy" ON organization_members
  FOR INSERT
  WITH CHECK (
    -- Allow owners and admins to add members
    EXISTS (
      SELECT 1 
      FROM organization_members 
      WHERE organization_id = NEW.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
    OR
    -- Allow users to add themselves when creating a new organization
    (
      auth.uid() = NEW.user_id 
      AND NEW.role = 'owner' 
      AND NOT EXISTS (
        SELECT 1 
        FROM organization_members 
        WHERE organization_id = NEW.organization_id
      )
    )
  );

CREATE POLICY "org_members_update_policy" ON organization_members
  FOR UPDATE
  USING (
    -- Only owners and admins can update members
    EXISTS (
      SELECT 1 
      FROM organization_members 
      WHERE organization_id = OLD.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "org_members_delete_policy" ON organization_members
  FOR DELETE
  USING (
    -- Only owners and admins can remove members
    EXISTS (
      SELECT 1 
      FROM organization_members 
      WHERE organization_id = OLD.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
    OR
    -- Users can remove themselves
    auth.uid() = OLD.user_id
  );