/*
  # Fix Organization Member Policies
  
  1. Overview
    Implements non-recursive RLS policies for organization members table
    
  2. Changes
    - Creates helper function for checking organization access
    - Drops existing problematic policies
    - Adds new non-recursive policies for CRUD operations
    - Implements proper role-based access control
    
  3. Security
    - Maintains strict access control based on user roles
    - Prevents unauthorized access to organization data
    - Ensures owners have full control
    - Allows admins to manage non-owner members
*/

-- Helper function to check organization access
CREATE OR REPLACE FUNCTION check_organization_access(org_id uuid)
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
    AND user_id = auth.uid()
  );
$$;

-- Helper function to check user role in organization
CREATE OR REPLACE FUNCTION check_organization_role(org_id uuid, allowed_roles text[])
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
    AND user_id = auth.uid()
    AND role = ANY(allowed_roles)
  );
$$;

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow select for organization members" ON organization_members;
DROP POLICY IF EXISTS "Allow insert for organization admins" ON organization_members;
DROP POLICY IF EXISTS "Allow update for organization admins" ON organization_members;
DROP POLICY IF EXISTS "Allow delete for organization admins" ON organization_members;

-- Select policy: Users can view members in their organizations
CREATE POLICY "Allow select for organization members"
ON organization_members
FOR SELECT
TO authenticated
USING (
  check_organization_access(organization_id)
);

-- Insert policy: Only owners and admins can add members
CREATE POLICY "Allow insert for organization admins"
ON organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  check_organization_role(organization_id, ARRAY['owner', 'admin'])
);

-- Update policy: Owners can update anyone, admins can update non-owners
CREATE POLICY "Allow update for organization admins"
ON organization_members
FOR UPDATE
TO authenticated
USING (
  CASE
    WHEN check_organization_role(organization_id, ARRAY['owner']) THEN true
    WHEN check_organization_role(organization_id, ARRAY['admin']) THEN
      -- Admins can't modify owner records
      NOT EXISTS (
        SELECT 1
        FROM organization_members target
        WHERE target.id = organization_members.id
        AND target.role = 'owner'
      )
    ELSE false
  END
)
WITH CHECK (
  CASE
    WHEN check_organization_role(organization_id, ARRAY['owner']) THEN true
    WHEN check_organization_role(organization_id, ARRAY['admin']) THEN
      -- Admins can't set someone as owner
      NEW.role != 'owner'
    ELSE false
  END
);

-- Delete policy: Owners can delete anyone, admins can delete non-owners
CREATE POLICY "Allow delete for organization admins"
ON organization_members
FOR DELETE
TO authenticated
USING (
  CASE
    WHEN check_organization_role(organization_id, ARRAY['owner']) THEN true
    WHEN check_organization_role(organization_id, ARRAY['admin']) THEN
      -- Admins can't delete owners
      NOT EXISTS (
        SELECT 1
        FROM organization_members target
        WHERE target.id = organization_members.id
        AND target.role = 'owner'
      )
    ELSE false
  END
);

-- Special policy for organization creation
CREATE POLICY "Allow self-insert during organization creation"
ON organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow users to insert themselves as owners when creating new organizations
  NEW.user_id = auth.uid() AND
  NEW.role = 'owner' AND
  NOT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = NEW.organization_id
  )
);