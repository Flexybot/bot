/*
  # Create organization tables and policies

  1. New Tables
    - `organizations`
      - `id` (uuid, primary key)
      - `name` (text)
      - `slug` (text, unique)
      - `logo_url` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `organization_members`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `user_id` (uuid, references auth.users)
      - `role` (text, enum: owner, admin, member)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for:
      - Organizations: members can read, owners/admins can update
      - Members: members can read, owners/admins can manage
*/

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create organization_members table
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Members can view their organizations"
  ON organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can update organizations"
  ON organizations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Organization members policies
CREATE POLICY "Members can view organization members"
  ON organization_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members members
      WHERE members.organization_id = organization_members.organization_id
      AND members.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can manage members"
  ON organization_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members members
      WHERE members.organization_id = organization_members.organization_id
      AND members.user_id = auth.uid()
      AND members.role IN ('owner', 'admin')
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();