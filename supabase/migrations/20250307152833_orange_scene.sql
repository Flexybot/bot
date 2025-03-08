/*
  # Fix Organization Policies

  1. Changes
    - Drop all existing organization-related policies
    - Create new policies with unique names
    - Add proper access control for organizations and members

  2. Security
    - Enable RLS on all tables
    - Add policies for organization access
    - Add policies for member management
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view organizations they are members of" ON organizations;
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
DROP POLICY IF EXISTS "Organization owners can manage organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view members in their organizations" ON organization_members;
DROP POLICY IF EXISTS "Users can view their own organization memberships" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can manage members" ON organization_members;
DROP POLICY IF EXISTS "Admins can manage organization members" ON organization_members;

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Organization Policies
CREATE POLICY "org_members_select" ON organizations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "org_owners_all" ON organizations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'owner'
    )
  );

-- Organization Members Policies
CREATE POLICY "org_members_view" ON organization_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members AS member
      WHERE member.organization_id = organization_members.organization_id
      AND member.user_id = auth.uid()
    )
  );

CREATE POLICY "org_admins_manage" ON organization_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members AS member
      WHERE member.organization_id = organization_members.organization_id
      AND member.user_id = auth.uid()
      AND member.role IN ('owner', 'admin')
    )
  );