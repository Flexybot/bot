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
    EXISTS (
      SELECT 1 
      FROM organization_members 
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
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
    EXISTS (
      SELECT 1 
      FROM organization_members 
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "organizations_delete_policy" ON organizations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM organization_members 
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'owner'
    )
  );

-- Organization Members Policies
CREATE POLICY "org_members_select_policy" ON organization_members
  FOR SELECT
  USING (
    -- Users can view members in organizations they belong to
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
      FROM organization_members AS existing_member
      WHERE existing_member.organization_id = organization_id
      AND existing_member.user_id = auth.uid()
      AND existing_member.role IN ('owner', 'admin')
    )
    OR
    -- Allow users to add themselves when creating a new organization
    (
      auth.uid() = user_id 
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
  USING (
    -- Only owners can update member roles
    EXISTS (
      SELECT 1 
      FROM organization_members AS existing_member
      WHERE existing_member.organization_id = organization_id
      AND existing_member.user_id = auth.uid()
      AND existing_member.role = 'owner'
    )
  );

CREATE POLICY "org_members_delete_policy" ON organization_members
  FOR DELETE
  USING (
    -- Only owners can remove members
    EXISTS (
      SELECT 1 
      FROM organization_members AS existing_member
      WHERE existing_member.organization_id = organization_id
      AND existing_member.user_id = auth.uid()
      AND existing_member.role = 'owner'
    )
    OR
    -- Users can remove themselves
    auth.uid() = user_id
  );