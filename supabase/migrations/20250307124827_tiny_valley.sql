/*
  # Billing System Schema

  1. New Tables
    - subscription_plans
      - Stores available subscription plans and their features
    - subscriptions
      - Tracks organization subscriptions and payment status
    - billing_details
      - Stores organization billing information
    - invoices
      - Records payment history and invoices
    - usage_logs
      - Tracks resource usage for billing purposes

  2. Security
    - Enable RLS on all tables
    - Implement policies for secure access
*/

-- Create subscription_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  price_monthly numeric NOT NULL,
  price_yearly numeric NOT NULL,
  features jsonb NOT NULL DEFAULT '{}',
  max_chatbots integer NOT NULL DEFAULT 1,
  max_team_members integer NOT NULL DEFAULT 1,
  max_documents integer NOT NULL DEFAULT 5,
  max_storage_mb integer NOT NULL DEFAULT 50,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  status text NOT NULL CHECK (status IN ('active', 'trialing', 'canceled', 'incomplete', 'past_due')),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id)
);

-- Create billing_details table
CREATE TABLE IF NOT EXISTS billing_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  business_name text,
  email text NOT NULL,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text,
  tax_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id)
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  currency text NOT NULL DEFAULT 'usd',
  invoice_date timestamptz NOT NULL,
  due_date timestamptz NOT NULL,
  paid_date timestamptz,
  stripe_invoice_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create usage_logs table
CREATE TABLE IF NOT EXISTS usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resource_type text NOT NULL CHECK (resource_type IN ('messages', 'storage', 'documents')),
  quantity numeric NOT NULL,
  logged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Policies for subscription_plans
CREATE POLICY IF NOT EXISTS "Anyone can view active plans" ON subscription_plans
  FOR SELECT
  USING (is_active = true);

-- Policies for subscriptions
CREATE POLICY IF NOT EXISTS "Organizations can view their subscription" ON subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = subscriptions.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can update their organization subscription" ON subscriptions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = subscriptions.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Policies for billing_details
CREATE POLICY IF NOT EXISTS "Organizations can view their billing details" ON billing_details
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = billing_details.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can manage billing details" ON billing_details
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = billing_details.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Policies for invoices
CREATE POLICY IF NOT EXISTS "Organizations can view their invoices" ON invoices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = invoices.organization_id
      AND user_id = auth.uid()
    )
  );

-- Policies for usage_logs
CREATE POLICY IF NOT EXISTS "Organizations can view their usage" ON usage_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = usage_logs.organization_id
      AND user_id = auth.uid()
    )
  );

-- Insert or update subscription plans
DO $$
BEGIN
  -- Free plan
  INSERT INTO subscription_plans (
    name, description, price_monthly, price_yearly, 
    features, max_chatbots, max_team_members, max_documents, max_storage_mb
  )
  VALUES (
    'Free',
    'For personal and small projects',
    0,
    0,
    '["1 chatbot", "1 team member", "Up to 5 documents", "50MB storage", "Basic analytics", "Community support"]',
    1,
    1,
    5,
    50
  )
  ON CONFLICT (name) 
  DO UPDATE SET
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    features = EXCLUDED.features,
    max_chatbots = EXCLUDED.max_chatbots,
    max_team_members = EXCLUDED.max_team_members,
    max_documents = EXCLUDED.max_documents,
    max_storage_mb = EXCLUDED.max_storage_mb,
    updated_at = now();

  -- Basic plan
  INSERT INTO subscription_plans (
    name, description, price_monthly, price_yearly,
    features, max_chatbots, max_team_members, max_documents, max_storage_mb
  )
  VALUES (
    'Basic',
    'For small businesses and startups',
    29,
    299,
    '["Up to 3 chatbots", "Up to 3 team members", "Up to 20 documents", "200MB storage", "Advanced analytics", "Email support", "Custom domain", "API access"]',
    3,
    3,
    20,
    200
  )
  ON CONFLICT (name)
  DO UPDATE SET
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    features = EXCLUDED.features,
    max_chatbots = EXCLUDED.max_chatbots,
    max_team_members = EXCLUDED.max_team_members,
    max_documents = EXCLUDED.max_documents,
    max_storage_mb = EXCLUDED.max_storage_mb,
    updated_at = now();

  -- Premium plan
  INSERT INTO subscription_plans (
    name, description, price_monthly, price_yearly,
    features, max_chatbots, max_team_members, max_documents, max_storage_mb
  )
  VALUES (
    'Premium',
    'For growing businesses and teams',
    79,
    799,
    '["Up to 10 chatbots", "Up to 10 team members", "Up to 100 documents", "1GB storage", "Advanced analytics", "Priority support", "Custom domain", "API access", "Custom branding", "Advanced RAG configuration"]',
    10,
    10,
    100,
    1024
  )
  ON CONFLICT (name)
  DO UPDATE SET
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    features = EXCLUDED.features,
    max_chatbots = EXCLUDED.max_chatbots,
    max_team_members = EXCLUDED.max_team_members,
    max_documents = EXCLUDED.max_documents,
    max_storage_mb = EXCLUDED.max_storage_mb,
    updated_at = now();
END $$;

-- Create function to calculate organization usage
CREATE OR REPLACE FUNCTION get_organization_usage(org_id uuid, start_date timestamptz DEFAULT NULL)
RETURNS TABLE (
  resource_type text,
  total_usage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ul.resource_type,
    SUM(ul.quantity) as total_usage
  FROM usage_logs ul
  WHERE 
    ul.organization_id = org_id
    AND (start_date IS NULL OR ul.logged_at >= start_date)
  GROUP BY ul.resource_type;
END;
$$;