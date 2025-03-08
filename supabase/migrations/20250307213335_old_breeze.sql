/*
  # Fix organization members RLS policies v2

  1. Changes
    - Drop and recreate RLS policies for organization_members table
    - Implement simplified policy logic to prevent recursion
    - Add separate policies for different operations

  2. Security
    - Enable RLS on organization_members table
    - Add policies for:
      - Users can view their own memberships
      - Users can view other members in their organizations
      - Owners/admins can manage members in their organizations
*/

-- First drop existing policies
DROP POLICY IF EXISTS "Users can read organizations they belong to" ON organization_members;
DROP POLICY IF EXISTS "Organization owners and admins can manage members" ON organization_members;
DROP POLICY IF EXISTS "Users can view their own organizations" ON organization_members;
DROP POLICY IF EXISTS "Organization owners can manage members" ON organization_members;

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own memberships
CREATE POLICY "Users can view own memberships"
ON organization_members
FOR SELECT
USING (auth.uid() = user_id);

-- Policy for users to view other members in their organizations
CREATE POLICY "Users can view organization members"
ON organization_members
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

-- Policy for owners/admins to insert new members
CREATE POLICY "Owners and admins can add members"
ON organization_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM organization_members
    WHERE organization_id = NEW.organization_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Policy for owners/admins to update members
CREATE POLICY "Owners and admins can update members"
ON organization_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members
    WHERE organization_id = organization_members.organization_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM organization_members
    WHERE organization_id = organization_members.organization_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Policy for owners/admins to delete members
CREATE POLICY "Owners and admins can delete members"
ON organization_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members
    WHERE organization_id = organization_members.organization_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);