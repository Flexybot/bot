/*
  # Fix Organization Members RLS Policies

  1. Changes
    - Drop existing policies causing recursion
    - Add new, properly scoped RLS policies for organization_members table
    - Ensure proper access control without recursive checks
  
  2. Security
    - Enable RLS on organization_members table
    - Add policies for:
      - Owners can manage all members in their organization
      - Admins can manage non-owner members in their organization
      - Members can view other members in their organization
      - Users can view their own memberships
*/

-- First, enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own memberships" ON organization_members;
DROP POLICY IF EXISTS "Organization owners can manage members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can manage non-owner members" ON organization_members;
DROP POLICY IF EXISTS "Members can view other members" ON organization_members;

-- Policy for users to view their own memberships
CREATE POLICY "Users can view their own memberships"
ON organization_members
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy for organization owners to manage all members
CREATE POLICY "Organization owners can manage members"
ON organization_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = organization_members.organization_id
    AND user_id = auth.uid()
    AND role = 'owner'
  )
);

-- Policy for organization admins to manage non-owner members
CREATE POLICY "Organization admins can manage non-owner members"
ON organization_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = organization_members.organization_id
    AND user_id = auth.uid()
    AND role = 'admin'
  )
  AND NOT EXISTS (
    SELECT 1 FROM organization_members target
    WHERE target.id = organization_members.id
    AND target.role = 'owner'
  )
);

-- Policy for members to view other members in their organization
CREATE POLICY "Members can view other members"
ON organization_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = organization_members.organization_id
    AND user_id = auth.uid()
  )
);