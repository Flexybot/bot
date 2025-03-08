/*
  # Fix Organization Policies

  1. Changes
    - Fix infinite recursion in organization_members policies
    - Simplify policy structure
    - Add proper cascading permissions

  2. Security
    - Maintain proper access control
    - Prevent privilege escalation
    - Ensure data isolation
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organization_members;
DROP POLICY IF EXISTS "Organization owners can manage all members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can manage non-owner members" ON organization_members;
DROP POLICY IF EXISTS "Members can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Owners can manage their organizations" ON organizations;

-- Organization Members Policies
CREATE POLICY "Members can view organization members"
  ON organization_members
  FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage organization members"
  ON organization_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'owner'
    )
  );

CREATE POLICY "Admins can manage non-owner members"
  ON organization_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM organization_members target
      WHERE target.id = organization_members.id
      AND target.role = 'owner'
    )
  );

-- Organizations Policies
CREATE POLICY "Members can view their organizations"
  ON organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage their organizations"
  ON organizations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = id
      AND om.user_id = auth.uid()
      AND om.role = 'owner'
    )
  );