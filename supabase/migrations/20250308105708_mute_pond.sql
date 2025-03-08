/*
  # Fix organization members RLS policies

  1. Changes
    - Drop existing RLS policies that may be causing recursion
    - Create new, optimized RLS policies for organization_members table
    - Add proper access control based on user roles
  
  2. Security
    - Enable RLS on organization_members table
    - Add policies for:
      - Viewing members (for organization members)
      - Managing members (for owners and admins)
      - Viewing own membership
*/

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Members can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Owners can manage members" ON organization_members;
DROP POLICY IF EXISTS "Users can view own membership" ON organization_members;

-- Allow users to view members of organizations they belong to
CREATE POLICY "Members can view organization members"
ON organization_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members members
    WHERE members.organization_id = organization_members.organization_id
    AND members.user_id = auth.uid()
  )
);

-- Allow organization owners and admins to manage members
CREATE POLICY "Owners and admins can manage members"
ON organization_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_members members
    WHERE members.organization_id = organization_members.organization_id
    AND members.user_id = auth.uid()
    AND members.role IN ('owner', 'admin')
  )
);

-- Allow users to view their own membership
CREATE POLICY "Users can view own membership"
ON organization_members
FOR SELECT
USING (
  user_id = auth.uid()
);