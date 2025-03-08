/*
  # Fix Organizations RLS Policies

  1. Changes
    - Create optimized policies for organizations table
    - Enable RLS on organizations table
  
  2. Security
    - Members can read their organizations
    - Only owners can modify organization details
*/

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Members can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Owners can manage organizations" ON organizations;

-- Create new policies

-- Allow members to read their organizations
CREATE POLICY "Read organizations"
  ON organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM organization_members 
      WHERE organization_id = organizations.id 
      AND user_id = auth.uid()
    )
  );

-- Allow owners to update organizations
CREATE POLICY "Update organizations"
  ON organizations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 
      FROM organization_members 
      WHERE organization_id = organizations.id 
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Allow owners to delete organizations
CREATE POLICY "Delete organizations"
  ON organizations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM organization_members 
      WHERE organization_id = organizations.id 
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );