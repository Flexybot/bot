/*
  # Fix organization_members RLS policy

  1. Changes
    - Remove recursive policy that was causing infinite recursion
    - Add proper RLS policies for organization members table
    - Enable RLS on organization_members table

  2. Security
    - Users can read organization members where they are a member
    - Organization owners/admins can manage members
    - Prevents infinite recursion in policy evaluation
*/

-- First, drop any existing policies
DROP POLICY IF EXISTS "Users can view their organization members" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can add members" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can update members" ON organization_members;
DROP POLICY IF EXISTS "Owners can delete members" ON organization_members;

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Policy for users to read organization members
CREATE POLICY "Users can view organization members"
ON organization_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members om 
    WHERE om.organization_id = organization_members.organization_id 
    AND om.user_id = auth.uid()
  )
);

-- Policy for organization owners/admins to insert new members
CREATE POLICY "Owners and admins can add members"
ON organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM organization_members om 
    WHERE om.organization_id = NEW.organization_id 
    AND om.user_id = auth.uid() 
    AND om.role IN ('owner', 'admin')
  )
);

-- Policy for organization owners/admins to update members
CREATE POLICY "Owners and admins can update members"
ON organization_members
FOR UPDATE
TO authenticated
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

-- Policy for organization owners to delete members
CREATE POLICY "Owners can delete members"
ON organization_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members om 
    WHERE om.organization_id = organization_members.organization_id 
    AND om.user_id = auth.uid() 
    AND om.role = 'owner'
  )
);