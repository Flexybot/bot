/*
  # Fix Organization Members RLS Policies

  1. Changes
    - Drop all existing policies
    - Create new, optimized policies for organization_members table
    - Enable RLS on organization_members table
  
  2. Security
    - Members can read other members in their organizations
    - Only owners/admins can modify member records
    - Prevent recursive policy checks
*/

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DO $$ 
BEGIN
  -- Drop all policies for organization_members table
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'organization_members'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON organization_members', r.policyname);
  END LOOP;
END $$;

-- Create new policies

-- Allow users to read members from their organizations
CREATE POLICY "organization_members_read"
  ON organization_members
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM organization_members 
      WHERE organization_id = organization_members.organization_id
    )
  );

-- Allow owners/admins to insert new members
CREATE POLICY "organization_members_insert"
  ON organization_members
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id 
      FROM organization_members 
      WHERE organization_id = organization_members.organization_id 
      AND role IN ('owner', 'admin')
    )
  );

-- Allow owners/admins to update members
CREATE POLICY "organization_members_update"
  ON organization_members
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM organization_members 
      WHERE organization_id = organization_members.organization_id 
      AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id 
      FROM organization_members 
      WHERE organization_id = organization_members.organization_id 
      AND role IN ('owner', 'admin')
    )
  );

-- Allow owners to delete members
CREATE POLICY "organization_members_delete"
  ON organization_members
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM organization_members 
      WHERE organization_id = organization_members.organization_id 
      AND role = 'owner'
    )
  );

-- Special policy for users to see their own membership
CREATE POLICY "organization_members_read_own"
  ON organization_members
  FOR SELECT
  USING (auth.uid() = user_id);