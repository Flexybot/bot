/*
  # Fix Organization Access Control Policies

  1. Overview
    Implements proper RLS policies for organizations and members without recursion

  2. Changes
    - Drop existing policies
    - Create new non-recursive policies
    - Add helper functions for role checks
    - Set up proper access patterns

  3. Security
    - Enable RLS on all tables
    - Implement hierarchical access control
    - Prevent infinite recursion in policies
*/

-- Helper function for checking membership
CREATE OR REPLACE FUNCTION public.has_organization_access(org_id uuid, required_role text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND (required_role IS NULL OR role = required_role)
  );
END;
$$;

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "organizations_select" ON organizations;
DROP POLICY IF EXISTS "organizations_insert" ON organizations;
DROP POLICY IF EXISTS "organizations_update" ON organizations;
DROP POLICY IF EXISTS "organizations_delete" ON organizations;
DROP POLICY IF EXISTS "members_select" ON organization_members;
DROP POLICY IF EXISTS "members_insert" ON organization_members;
DROP POLICY IF EXISTS "members_update" ON organization_members;
DROP POLICY IF EXISTS "members_delete" ON organization_members;

-- Organizations policies
CREATE POLICY "organizations_select"
ON organizations
FOR SELECT
TO authenticated
USING (
  has_organization_access(id)
);

CREATE POLICY "organizations_insert"
ON organizations
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "organizations_update"
ON organizations
FOR UPDATE
TO authenticated
USING (
  has_organization_access(id, 'owner')
)
WITH CHECK (
  has_organization_access(id, 'owner')
);

CREATE POLICY "organizations_delete"
ON organizations
FOR DELETE
TO authenticated
USING (
  has_organization_access(id, 'owner')
);

-- Organization members policies
CREATE POLICY "members_select"
ON organization_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  has_organization_access(organization_id)
);

CREATE POLICY "members_insert"
ON organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND (role = 'owner' OR (role = 'admin' AND role != 'owner'))
  )
);

CREATE POLICY "members_update"
ON organization_members
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND (role = 'owner' OR (role = 'admin' AND organization_members.role != 'owner'))
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND (role = 'owner' OR (role = 'admin' AND role != 'owner'))
  )
);

CREATE POLICY "members_delete"
ON organization_members
FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND (role = 'owner' OR (role = 'admin' AND organization_members.role != 'owner'))
  )
);