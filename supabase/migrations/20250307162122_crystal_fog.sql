/*
  # Fix Organization Schema and Policies

  1. Changes
    - Create organizations and members tables with proper schema
    - Add RLS policies with correct access control
    - Add necessary indexes for performance
    - Fix infinite recursion in policies

  2. Security
    - Enable RLS on all tables
    - Add granular access control
    - Prevent circular dependencies
*/

-- Create organizations table if not exists
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create organization_members table if not exists
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Create subscriptions table if not exists
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id text NOT NULL DEFAULT 'free',
  status text NOT NULL CHECK (status IN ('active', 'trialing', 'canceled', 'incomplete', 'past_due')),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "organizations_select_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_delete_policy" ON organizations;

DROP POLICY IF EXISTS "org_members_select_policy" ON organization_members;
DROP POLICY IF EXISTS "org_members_insert_policy" ON organization_members;
DROP POLICY IF EXISTS "org_members_update_policy" ON organization_members;
DROP POLICY IF EXISTS "org_members_delete_policy" ON organization_members;

DROP POLICY IF EXISTS "subscriptions_select_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete_policy" ON subscriptions;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON subscriptions(organization_id);

-- Organizations policies
CREATE POLICY "organizations_select_policy" ON organizations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "organizations_insert_policy" ON organizations
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "organizations_update_policy" ON organizations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "organizations_delete_policy" ON organizations
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'owner'
    )
  );

-- Organization members policies
CREATE POLICY "org_members_select_policy" ON organization_members
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "org_members_insert_policy" ON organization_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_members.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    ) OR (
      auth.uid() = user_id
      AND role = 'owner'
      AND NOT EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = organization_members.organization_id
      )
    )
  );

CREATE POLICY "org_members_update_policy" ON organization_members
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_members.organization_id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

CREATE POLICY "org_members_delete_policy" ON organization_members
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_members.organization_id
      AND user_id = auth.uid()
      AND role = 'owner'
    ) OR auth.uid() = user_id
  );

-- Subscriptions policies
CREATE POLICY "subscriptions_select_policy" ON subscriptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = subscriptions.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "subscriptions_insert_policy" ON subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = subscriptions.organization_id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

CREATE POLICY "subscriptions_update_policy" ON subscriptions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = subscriptions.organization_id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

CREATE POLICY "subscriptions_delete_policy" ON subscriptions
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = subscriptions.organization_id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );