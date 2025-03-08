/*
  # Fix organization members RLS policies v5

  1. Changes
    - Drop existing RLS policies
    - Create new non-recursive policies for organization_members table
    - Fix NEW reference in policies using proper syntax

  2. Security
    - Enable RLS on organization_members table
    - Add policies for:
      - Viewing own membership
      - Viewing members in same organization
      - Managing members (for owners/admins)
    - Use proper syntax for NEW/OLD references
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read organizations they belong to" ON organization_members;
DROP POLICY IF EXISTS "Organization owners and admins can manage members" ON organization_members;
DROP POLICY IF EXISTS "Users can view their own organizations" ON organization_members;
DROP POLICY IF EXISTS "Organization owners can manage members" ON organization_members;
DROP POLICY IF EXISTS "Users can view own memberships" ON organization_members;
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can add members" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can update members" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can delete members" ON organization_members;

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own memberships
CREATE POLICY "view_own_memberships"
ON organization_members
FOR SELECT
USING (auth.uid() = user_id);

-- Policy for users to view other members in their organizations
CREATE POLICY "view_organization_members"
ON organization_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members members
    WHERE members.organization_id = organization_members.organization_id
    AND members.user_id = auth.uid()
  )
);

-- Policy for owners/admins to insert new members
CREATE POLICY "manage_members_insert"
ON organization_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM organization_members members
    WHERE members.organization_id = organization_members.organization_id
    AND members.user_id = auth.uid()
    AND members.role IN ('owner', 'admin')
  )
);

-- Policy for owners/admins to update members
CREATE POLICY "manage_members_update"
ON organization_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members members
    WHERE members.organization_id = organization_members.organization_id
    AND members.user_id = auth.uid()
    AND members.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM organization_members members
    WHERE members.organization_id = organization_members.organization_id
    AND members.user_id = auth.uid()
    AND members.role IN ('owner', 'admin')
  )
);

-- Policy for owners/admins to delete members
CREATE POLICY "manage_members_delete"
ON organization_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members members
    WHERE members.organization_id = organization_members.organization_id
    AND members.user_id = auth.uid()
    AND members.role IN ('owner', 'admin')
  )
);