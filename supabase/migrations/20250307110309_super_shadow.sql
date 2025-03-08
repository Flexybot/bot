/*
  # Fix Organization Members Policies

  1. Changes
    - Drop existing problematic RLS policies
    - Create new, optimized RLS policies with unique names
    - Add proper role-based access control
  
  2. Security
    - Enable RLS on organization_members table
    - Add policies for:
      - View: Users can view organizations they belong to
      - Create: Admins/owners can add members
      - Update: Admins/owners can update members
      - Delete: Admins/owners can remove members
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can add members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can update members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can delete members" ON organization_members;

-- Create new policies with unique names
CREATE POLICY "view_organization_members"
  ON organization_members
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_members.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "create_organization_members"
  ON organization_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_members.organization_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "update_organization_members"
  ON organization_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_members.organization_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "delete_organization_members"
  ON organization_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_members.organization_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );