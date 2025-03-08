/*
  # Organization and Member Policies

  1. Security
    - Enable RLS on organization_members table
    - Add policies for:
      - Users can read their own organization memberships
      - Organization admins/owners can manage members
      - Users can read basic organization info they're members of
*/

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own memberships
CREATE POLICY "Users can read own memberships"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow organization admins/owners to manage members
CREATE POLICY "Admins can manage members"
  ON organization_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'owner')
    )
  );

-- Allow members to read basic organization info
CREATE POLICY "Members can read organization info"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organizations.id
      AND om.user_id = auth.uid()
    )
  );