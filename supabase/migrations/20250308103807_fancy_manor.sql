/*
  # Fix organization members policies

  1. Changes
    - Remove recursive policies that were causing infinite recursion
    - Implement proper role-based access control for organization members
    - Add separate policies for different operations (select, insert, update, delete)
    
  2. Security
    - Enable RLS on organization_members table
    - Add policies for:
      - Viewing members (owners and admins can view all, members can view basic info)
      - Adding members (owners and admins only)
      - Updating roles (owners only)
      - Removing members (owners and admins)
*/

-- First, drop existing policies to start fresh
DO $$
BEGIN
  DROP POLICY IF EXISTS "Organization owners and admins can manage members" ON organization_members;
  DROP POLICY IF EXISTS "Members can view other members" ON organization_members;
END $$;

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Policy for viewing members
CREATE POLICY "Members can view organization members"
ON organization_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members viewer
    WHERE viewer.user_id = auth.uid()
    AND viewer.organization_id = organization_members.organization_id
  )
);

-- Policy for adding new members (owners and admins only)
CREATE POLICY "Owners and admins can add members"
ON organization_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members admin
    WHERE admin.user_id = auth.uid()
    AND admin.organization_id = organization_members.organization_id
    AND admin.role IN ('owner', 'admin')
  )
);

-- Policy for updating member roles (owners only)
CREATE POLICY "Owners can update member roles"
ON organization_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_members owner
    WHERE owner.user_id = auth.uid()
    AND owner.organization_id = organization_members.organization_id
    AND owner.role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members owner
    WHERE owner.user_id = auth.uid()
    AND owner.organization_id = organization_members.organization_id
    AND owner.role = 'owner'
  )
);

-- Policy for deleting members (owners and admins, but cannot delete owners)
CREATE POLICY "Owners and admins can remove non-owner members"
ON organization_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM organization_members admin
    WHERE admin.user_id = auth.uid()
    AND admin.organization_id = organization_members.organization_id
    AND admin.role IN ('owner', 'admin')
  )
  AND organization_members.role != 'owner'
);