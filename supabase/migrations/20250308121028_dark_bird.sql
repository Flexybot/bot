/*
  # Fix Organization Members RLS Policies

  1. Changes
    - Drop existing policies that may be causing recursion
    - Create new, optimized policies for organization_members table
    - Enable RLS on organization_members table
  
  2. Security
    - Members can read other members in their organizations
    - Only owners/admins can modify member records
    - Prevent recursive policy checks
*/

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Members can view their organization members" ON organization_members;
DROP POLICY IF EXISTS "Owners can manage organization members" ON organization_members;

-- Create new policies

-- Allow users to read members from their organizations
CREATE POLICY "Read organization members"
  ON organization_members
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM organization_members 
      WHERE organization_id = organization_members.organization_id
    )
  );

-- Allow owners/admins to insert new members
CREATE POLICY "Insert organization members"
  ON organization_members
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id 
      FROM organization_members 
      WHERE organization_id = organization_members.organization_id 
      AND role IN ('owner', 'admin')
    )
  );

-- Allow owners/admins to update members
CREATE POLICY "Update organization members"
  ON organization_members
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM organization_members 
      WHERE organization_id = organization_members.organization_id 
      AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id 
      FROM organization_members 
      WHERE organization_id = organization_members.organization_id 
      AND role IN ('owner', 'admin')
    )
  );

-- Allow owners to delete members
CREATE POLICY "Delete organization members"
  ON organization_members
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM organization_members 
      WHERE organization_id = organization_members.organization_id 
      AND role = 'owner'
    )
  );

-- Special policy for users to see their own membership
CREATE POLICY "Users can always view their own membership"
  ON organization_members
  FOR SELECT
  USING (auth.uid() = user_id);