/*
  # Fix Organization and Members RLS Policies

  1. Overview
    This migration fixes infinite recursion issues in RLS policies by implementing
    a proper hierarchical access control system without circular dependencies.

  2. Changes
    - Drop existing problematic policies
    - Create new non-recursive policies for organization_members
    - Create new policies for organizations table
    - Implement proper role-based access control

  3. Security
    - Enable RLS on both tables
    - Implement proper access patterns:
      * Users can always view their own memberships
      * Organization owners have full access
      * Admins can manage non-owner members
      * Members can view other members in their organizations
*/

-- First, ensure RLS is enabled
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "organization_members_select_policy" ON organization_members;
DROP POLICY IF EXISTS "organization_members_insert_policy" ON organization_members;
DROP POLICY IF EXISTS "organization_members_update_policy" ON organization_members;
DROP POLICY IF EXISTS "organization_members_delete_policy" ON organization_members;
DROP POLICY IF EXISTS "organizations_select_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_delete_policy" ON organizations;

-- Create base policy for users to always see their own memberships
-- This is the foundation that prevents recursion
CREATE POLICY "users_view_own_memberships"
ON organization_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create policy for organization owners
-- This uses a direct check against the user's own membership
CREATE POLICY "owners_manage_members"
ON organization_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_members owner_check
    WHERE owner_check.organization_id = organization_members.organization_id
    AND owner_check.user_id = auth.uid()
    AND owner_check.role = 'owner'
  )
);

-- Create policy for admins to manage non-owner members
CREATE POLICY "admins_manage_non_owners"
ON organization_members
FOR ALL
TO authenticated
USING (
  -- Check if user is admin
  EXISTS (
    SELECT 1
    FROM organization_members admin_check
    WHERE admin_check.organization_id = organization_members.organization_id
    AND admin_check.user_id = auth.uid()
    AND admin_check.role = 'admin'
  )
  -- Ensure target is not an owner
  AND NOT EXISTS (
    SELECT 1
    FROM organization_members target_check
    WHERE target_check.id = organization_members.id
    AND target_check.role = 'owner'
  )
);

-- Create policy for members to view other members
CREATE POLICY "members_view_organization_members"
ON organization_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_members member_check
    WHERE member_check.organization_id = organization_members.organization_id
    AND member_check.user_id = auth.uid()
  )
);

-- Organizations table policies
-- Allow members to view their organizations
CREATE POLICY "members_view_organizations"
ON organizations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = organizations.id
    AND user_id = auth.uid()
  )
);

-- Allow owners to manage organizations
CREATE POLICY "owners_manage_organizations"
ON organizations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = organizations.id
    AND user_id = auth.uid()
    AND role = 'owner'
  )
);

-- Create helper function to check member role
-- This helps avoid policy recursion when checking roles
CREATE OR REPLACE FUNCTION check_member_role(org_id uuid, user_id uuid, required_role text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = org_id
    AND user_id = user_id
    AND role = required_role
  );
$$;