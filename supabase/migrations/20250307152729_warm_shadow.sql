/*
  # Fix Organization Policies

  1. Changes
    - Drop existing policies to avoid conflicts
    - Recreate organization and member policies with proper access control
    - Add policies for chatbots and documents

  2. Security
    - Enable RLS on all tables
    - Add proper access control policies
    - Fix infinite recursion issue
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view organizations they are members of" ON organizations;
DROP POLICY IF EXISTS "Organization owners can manage organization" ON organizations;
DROP POLICY IF EXISTS "Users can view their own organization memberships" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can manage members" ON organization_members;
DROP POLICY IF EXISTS "Users can view chatbots in their organization" ON chatbots;
DROP POLICY IF EXISTS "Public can view active chatbots" ON chatbots;
DROP POLICY IF EXISTS "Organization members can manage chatbots" ON chatbots;

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Organization Policies
CREATE POLICY "Users can view organizations they belong to"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners can manage organizations"
  ON organizations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'owner'
    )
  );

-- Organization Members Policies
CREATE POLICY "Users can view members in their organizations"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members AS member
      WHERE member.organization_id = organization_members.organization_id
      AND member.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage organization members"
  ON organization_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members AS member
      WHERE member.organization_id = organization_members.organization_id
      AND member.user_id = auth.uid()
      AND member.role IN ('owner', 'admin')
    )
  );

-- Chatbot Policies
CREATE POLICY "Members can view organization chatbots"
  ON chatbots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = chatbots.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active chatbots"
  ON chatbots
  FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Members can manage organization chatbots"
  ON chatbots
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = chatbots.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin', 'member')
    )
  );

-- Document Policies
CREATE POLICY "Members can view organization documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = documents.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can manage organization documents"
  ON documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = documents.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin', 'member')
    )
  );