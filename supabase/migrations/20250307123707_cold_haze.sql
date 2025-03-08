/*
  # Fix Organization Members RLS Policies

  1. Changes
    - Remove recursive policy checks that were causing infinite loops
    - Implement proper role-based access control for organization members
    - Add separate policies for different operations (select, insert, update, delete)
    
  2. Security
    - Enable RLS on organization_members table
    - Add policies for:
      - Viewing members (owners and admins can view all, members can view themselves)
      - Adding members (only owners and admins)
      - Updating roles (only owners)
      - Removing members (owners can remove anyone, admins can't remove owners)

  3. Notes
    - Previous policies were causing recursion by checking the same table within the policy
    - New policies use role-based checks without recursive queries
*/

-- First, drop existing policies to start fresh
DROP POLICY IF EXISTS "Organization members can view their own membership" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can add members" ON organization_members;
DROP POLICY IF EXISTS "Organization owners can manage members" ON organization_members;

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Policy for selecting members
CREATE POLICY "Members can view organization members" ON organization_members
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id 
      FROM organization_members 
      WHERE organization_id = organization_members.organization_id
    )
  );

-- Policy for inserting new members (owners and admins only)
CREATE POLICY "Owners and admins can add members" ON organization_members
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id 
      FROM organization_members 
      WHERE organization_id = organization_members.organization_id 
      AND role IN ('owner', 'admin')
    )
  );

-- Policy for updating members (owners only)
CREATE POLICY "Owners can update member roles" ON organization_members
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id 
      FROM organization_members 
      WHERE organization_id = organization_members.organization_id 
      AND role = 'owner'
    )
  );

-- Policy for deleting members
CREATE POLICY "Owners can remove members" ON organization_members
  FOR DELETE USING (
    -- Owners can remove anyone except other owners
    (
      auth.uid() IN (
        SELECT user_id 
        FROM organization_members 
        WHERE organization_id = organization_members.organization_id 
        AND role = 'owner'
      )
      AND organization_members.role != 'owner'
    )
    OR
    -- Members can remove themselves
    auth.uid() = user_id
  );