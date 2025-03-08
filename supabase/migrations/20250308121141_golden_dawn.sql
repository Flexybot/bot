/*
  # Fix Organizations RLS Policies

  1. Changes
    - Drop all existing policies
    - Create optimized policies for organizations table
    - Enable RLS on organizations table
  
  2. Security
    - Members can read their organizations
    - Only owners can modify organization details
*/

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DO $$ 
BEGIN
  -- Drop all policies for organizations table
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'organizations'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON organizations', r.policyname);
  END LOOP;
END $$;

-- Create new policies

-- Allow members to read their organizations
CREATE POLICY "organizations_read"
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
CREATE POLICY "organizations_update"
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
CREATE POLICY "organizations_delete"
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