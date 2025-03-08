/*
  # Create Row Level Security Policies

  1. Organization Members Policies
    - Owners can manage all members
    - Admins can view all members and manage non-owner members
    - Members can view all members
    - Users can view organizations they belong to
  
  2. Organizations Policies
    - Members can view their organizations
    - Owners can manage their organizations
*/

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Organization Members Policies
CREATE POLICY "Users can view organizations they belong to"
  ON organization_members
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM organization_members 
      WHERE organization_id = organization_members.organization_id
    )
  );

CREATE POLICY "Organization owners can manage all members"
  ON organization_members
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id
      FROM organization_members
      WHERE organization_id = organization_members.organization_id
      AND role = 'owner'
    )
  );

CREATE POLICY "Organization admins can manage non-owner members"
  ON organization_members
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id
      FROM organization_members
      WHERE organization_id = organization_members.organization_id
      AND role = 'admin'
    )
    AND organization_members.role != 'owner'
  );

-- Organizations Policies
CREATE POLICY "Members can view their organizations"
  ON organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage their organizations"
  ON organizations
  FOR ALL
  USING (
    id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );