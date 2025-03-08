/*
  # Multi-tenant Platform Extension

  1. New Tables
    - organizations
      - Core organization/tenant data
      - Includes name, slug, and logo
    - organization_members
      - Links users to organizations with roles
    - subscription_plans
      - Available subscription tiers
      - Includes limits and features
    - subscriptions
      - Active subscriptions for organizations
      - Tracks billing periods and status
    - chatbots
      - Configurable chatbot instances
      - Includes AI model settings
    - api_keys
      - API access management
    - statistics
      - Usage tracking and analytics

  2. Security
    - RLS enabled on all tables
    - Role-based access control
    - Organization-level data isolation
*/

-- Create extensions if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Organization Members Table
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    price_monthly INTEGER NOT NULL,
    price_yearly INTEGER NOT NULL,
    features JSONB NOT NULL,
    max_chatbots INTEGER NOT NULL,
    max_team_members INTEGER NOT NULL,
    max_documents INTEGER NOT NULL,
    max_storage_mb INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'trialing', 'canceled', 'incomplete', 'past_due')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    stripe_customer_id VARCHAR(100),
    stripe_subscription_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(organization_id)
);

-- Chatbots Table
CREATE TABLE IF NOT EXISTS public.chatbots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    avatar_url TEXT,
    welcome_message TEXT,
    system_prompt TEXT,
    model VARCHAR(50) NOT NULL DEFAULT 'gpt-3.5-turbo',
    temperature NUMERIC(3,2) DEFAULT 0.7,
    is_active BOOLEAN NOT NULL DEFAULT true,
    embedding_model VARCHAR(50) NOT NULL DEFAULT 'text-embedding-ada-002',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.chatbots ENABLE ROW LEVEL SECURITY;

-- API Keys Table
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key VARCHAR(100) NOT NULL UNIQUE,
    scopes VARCHAR(20)[] NOT NULL DEFAULT '{read}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Statistics Table
CREATE TABLE IF NOT EXISTS public.statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_messages INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    total_sessions INTEGER NOT NULL DEFAULT 0,
    total_users INTEGER NOT NULL DEFAULT 0,
    avg_response_time NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(organization_id, chatbot_id, date)
);

ALTER TABLE public.statistics ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Organizations
CREATE POLICY "Users can view their organizations"
    ON organizations FOR SELECT
    TO authenticated
    USING (
        id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organization admins can update their organization"
    ON organizations FOR UPDATE
    TO authenticated
    USING (
        id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Organization Members
CREATE POLICY "Users can view members in their organizations"
    ON organization_members FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organization admins can manage members"
    ON organization_members FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Subscription Plans
CREATE POLICY "Anyone can view active subscription plans"
    ON subscription_plans FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Subscriptions
CREATE POLICY "Users can view their organization's subscription"
    ON subscriptions FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Chatbots
CREATE POLICY "Users can view their organization's chatbots"
    ON chatbots FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organization admins can manage chatbots"
    ON chatbots FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- API Keys
CREATE POLICY "Users can view their organization's API keys"
    ON api_keys FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organization admins can manage API keys"
    ON api_keys FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Statistics
CREATE POLICY "Users can view their organization's statistics"
    ON statistics FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features, max_chatbots, max_team_members, max_documents, max_storage_mb, is_active)
VALUES
    ('Free', 'Get started with basic features', 0, 0, 
    '{"features": ["1 chatbot", "Basic analytics", "Email support"]}',
    1, 3, 10, 100, true),
    
    ('Pro', 'Perfect for growing teams', 2900, 29900,
    '{"features": ["5 chatbots", "Advanced analytics", "Priority support", "Custom branding", "API access"]}',
    5, 10, 100, 1000, true),
    
    ('Enterprise', 'For large organizations', 9900, 99900,
    '{"features": ["Unlimited chatbots", "Enterprise analytics", "24/7 support", "Custom features", "SLA", "Training"]}',
    999999, 999999, 999999, 999999, true);