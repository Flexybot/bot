/*
  # Initial Schema Setup

  1. New Tables
    - organizations
      - id (uuid, primary key)
      - name (text)
      - slug (text, unique)
      - created_at (timestamptz)
      - updated_at (timestamptz)
    
    - organization_members
      - id (uuid, primary key)
      - organization_id (uuid, foreign key)
      - user_id (uuid, foreign key)
      - role (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)
    
    - subscription_plans
      - id (uuid, primary key)
      - name (text)
      - description (text)
      - price_monthly (numeric)
      - price_yearly (numeric)
      - features (jsonb)
      - max_chatbots (integer)
      - max_team_members (integer)
      - max_documents (integer)
      - max_storage_mb (integer)
      - is_active (boolean)
      - created_at (timestamptz)
      - updated_at (timestamptz)
    
    - subscriptions
      - id (uuid, primary key)
      - organization_id (uuid, foreign key)
      - plan_id (uuid, foreign key)
      - status (text)
      - current_period_start (timestamptz)
      - current_period_end (timestamptz)
      - cancel_at_period_end (boolean)
      - stripe_customer_id (text)
      - stripe_subscription_id (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
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

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_monthly numeric NOT NULL,
  price_yearly numeric NOT NULL,
  features jsonb NOT NULL DEFAULT '{}',
  max_chatbots integer NOT NULL,
  max_team_members integer NOT NULL,
  max_documents integer NOT NULL,
  max_storage_mb integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('active', 'trialing', 'canceled', 'incomplete', 'past_due')),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for organizations
CREATE POLICY "Users can view organizations they are members of"
  ON organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners and admins can update their organizations"
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

-- Create policies for organization_members
CREATE POLICY "Users can view members of their organizations"
  ON organization_members
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners and admins can manage members"
  ON organization_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_members.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Create policies for subscription_plans
CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans
  FOR SELECT
  USING (is_active = true);

-- Create policies for subscriptions
CREATE POLICY "Users can view their organization's subscription"
  ON subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = subscriptions.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners and admins can manage subscriptions"
  ON subscriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = subscriptions.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);