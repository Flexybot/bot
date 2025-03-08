/*
  # Fix Organizations RLS Policies

  1. Changes
    - Add proper RLS policies for organizations table
    - Ensure organization access is properly controlled
  
  2. Security
    - Enable RLS on organizations table
    - Add policies for:
      - Members can view their organizations
      - Owners can manage their organizations
*/

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Members can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Owners can manage their organizations" ON organizations;

-- Policy for members to view their organizations
CREATE POLICY "Members can view their organizations"
ON organizations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = organizations.id
    AND user_id = auth.uid()
  )
);

-- Policy for owners to manage their organizations
CREATE POLICY "Owners can manage their organizations"
ON organizations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = organizations.id
    AND user_id = auth.uid()
    AND role = 'owner'
  )
);