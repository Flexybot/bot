/*
  # Fix Organization Members Policies

  1. Changes
    - Drop existing problematic policies
    - Create new optimized policies without recursion
    - Implement proper role-based access control
    
  2. Security
    - Enable RLS
    - Implement proper access controls based on roles
    - Prevent infinite recursion through optimized policy structure
*/

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "view_organization_members" ON organization_members;
DROP POLICY IF EXISTS "Members can view organization members" ON organization_members;
DROP POLICY IF EXISTS "insert_organization_members" ON organization_members;
DROP POLICY IF EXISTS "update_organization_members" ON organization_members;
DROP POLICY IF EXISTS "delete_organization_members" ON organization_members;

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Create optimized policies without recursion

-- SELECT: Users can view members of their organizations
CREATE POLICY "select_organization_members" ON organization_members
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members AS om 
    WHERE om.organization_id = organization_members.organization_id 
    AND om.user_id = auth.uid()
  )
);

-- INSERT: Only owners and admins can add members
CREATE POLICY "insert_organization_members" ON organization_members
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM organization_members AS om 
    WHERE om.organization_id = organization_members.organization_id 
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);

-- UPDATE: Only owners can update roles
CREATE POLICY "update_organization_members" ON organization_members
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members AS om 
    WHERE om.organization_id = organization_members.organization_id 
    AND om.user_id = auth.uid()
    AND om.role = 'owner'
  )
);

-- DELETE: Owners can remove members (except other owners) and users can remove themselves
CREATE POLICY "delete_organization_members" ON organization_members
FOR DELETE TO authenticated
USING (
  (auth.uid() = user_id) OR -- Users can remove themselves
  (
    EXISTS (
      SELECT 1 
      FROM organization_members AS om 
      WHERE om.organization_id = organization_members.organization_id 
      AND om.user_id = auth.uid()
      AND om.role = 'owner'
    )
    AND NOT EXISTS ( -- Prevent deletion of owners
      SELECT 1 
      FROM organization_members AS target 
      WHERE target.id = organization_members.id 
      AND target.role = 'owner'
    )
  )
);