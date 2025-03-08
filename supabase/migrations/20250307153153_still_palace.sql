/*
  # Fix Organization Policies

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create new policies with proper access control
    - Add indexes for better performance
    - Fix policy syntax to avoid NEW reference errors

  2. Security
    - Enable RLS on all tables
    - Add proper policies for organization access
    - Add policies for member management
*/

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view organizations they are members of" ON organizations;
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
DROP POLICY IF EXISTS "Organization owners can manage organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view members in their organizations" ON organization_members;
DROP POLICY IF EXISTS "Users can view their own organization memberships" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can manage members" ON organization_members;
DROP POLICY IF EXISTS "Admins can manage organization members" ON organization_members;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);

-- Organization Policies
CREATE POLICY "organizations_select_policy" ON organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "organizations_insert_policy" ON organizations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

CREATE POLICY "organizations_update_policy" ON organizations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

CREATE POLICY "organizations_delete_policy" ON organizations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = id
      AND user_id = auth.uid()
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
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_members.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "org_members_update_policy" ON organization_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_members.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "org_members_delete_policy" ON organization_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_members.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );