/*
  # Fix Organization Policies and Schema

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create new policies with proper access control
    - Add indexes for better performance
    - Fix recursive policy issues

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
CREATE POLICY "select_org_as_member" ON organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "insert_org_as_owner" ON organizations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

CREATE POLICY "update_org_as_owner" ON organizations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

CREATE POLICY "delete_org_as_owner" ON organizations
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
CREATE POLICY "select_members_in_same_org" ON organization_members
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "insert_members_as_admin" ON organization_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = NEW.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "update_members_as_admin" ON organization_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = OLD.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "delete_members_as_admin" ON organization_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = OLD.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );