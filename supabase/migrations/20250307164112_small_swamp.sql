/*
  # Base Schema Setup

  1. New Tables
    - `organizations` - Organization details
    - `organization_members` - Organization membership and roles
    - `subscription_plans` - Available subscription plans
    - `subscriptions` - Organization subscriptions
    - `chatbots` - Chatbot configurations
    - `chats` - Chat sessions
    - `messages` - Chat message history
    - `message_feedback` - User feedback on responses
    - `documents` - Knowledge base documents
    - `document_embeddings` - Vector embeddings for documents
    - `statistics` - Usage statistics

  2. Security
    - Enable RLS on all tables
    - Add policies for organization-based access

  3. Functions
    - `match_documents` - Similarity search for documents
    - `update_message_stats` - Update message statistics
*/

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create organization members table
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  price_monthly numeric NOT NULL,
  price_yearly numeric NOT NULL,
  features jsonb DEFAULT '{}',
  max_chatbots integer NOT NULL,
  max_team_members integer NOT NULL,
  max_documents integer NOT NULL,
  max_storage_mb integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES subscription_plans(id),
  status text NOT NULL CHECK (status IN ('active', 'trialing', 'canceled', 'incomplete', 'past_due')),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- Create chatbots table
CREATE TABLE IF NOT EXISTS chatbots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  avatar_url text,
  system_prompt text NOT NULL,
  welcome_message text,
  temperature numeric DEFAULT 0.7,
  model text DEFAULT 'gpt-3.5-turbo',
  is_active boolean DEFAULT true,
  use_rag boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  chatbot_id uuid NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create message feedback table
CREATE TABLE IF NOT EXISTS message_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  chatbot_id uuid NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_helpful boolean NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  chatbot_id uuid REFERENCES chatbots(id) ON DELETE CASCADE,
  title text,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create document embeddings table with vector support
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS document_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  chatbot_id uuid REFERENCES chatbots(id) ON DELETE CASCADE,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create statistics table
CREATE TABLE IF NOT EXISTS statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  chatbot_id uuid REFERENCES chatbots(id) ON DELETE CASCADE,
  date date NOT NULL,
  total_messages integer DEFAULT 0,
  total_sessions integer DEFAULT 0,
  total_users integer DEFAULT 0,
  avg_response_time numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, chatbot_id, date)
);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_chatbots_org ON chatbots(organization_id);
CREATE INDEX idx_chats_chatbot ON chats(chatbot_id);
CREATE INDEX idx_chats_org ON chats(organization_id);
CREATE INDEX idx_messages_chat ON messages(chat_id);
CREATE INDEX idx_messages_chatbot ON messages(chatbot_id);
CREATE INDEX idx_messages_org ON messages(organization_id);
CREATE INDEX idx_feedback_message ON message_feedback(message_id);
CREATE INDEX idx_feedback_chat ON message_feedback(chat_id);
CREATE INDEX idx_feedback_chatbot ON message_feedback(chatbot_id);
CREATE INDEX idx_feedback_org ON message_feedback(organization_id);
CREATE INDEX idx_documents_org ON documents(organization_id);
CREATE INDEX idx_documents_chatbot ON documents(chatbot_id);
CREATE INDEX idx_embeddings_document ON document_embeddings(document_id);
CREATE INDEX idx_embeddings_org ON document_embeddings(organization_id);
CREATE INDEX idx_embeddings_chatbot ON document_embeddings(chatbot_id);
CREATE INDEX idx_statistics_org ON statistics(organization_id);
CREATE INDEX idx_statistics_chatbot ON statistics(chatbot_id);
CREATE INDEX idx_statistics_date ON statistics(date);

-- Create vector similarity search function
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_conditions jsonb DEFAULT '[]'
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.metadata,
    1 - (e.embedding <=> query_embedding) as similarity
  FROM document_embeddings e
  JOIN documents d ON d.id = e.document_id
  WHERE 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create message stats update function
CREATE OR REPLACE FUNCTION update_message_stats()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO statistics (
    organization_id,
    chatbot_id,
    date,
    total_messages,
    total_sessions,
    total_users,
    avg_response_time
  )
  VALUES (
    NEW.organization_id,
    NEW.chatbot_id,
    CURRENT_DATE,
    1,
    1,
    1,
    EXTRACT(EPOCH FROM (NEW.created_at - LAG(NEW.created_at) OVER (PARTITION BY NEW.chat_id ORDER BY NEW.created_at)))
  )
  ON CONFLICT (organization_id, chatbot_id, date)
  DO UPDATE SET
    total_messages = statistics.total_messages + 1,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Create message stats trigger
CREATE TRIGGER update_message_stats_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_message_stats();

-- RLS Policies

-- Organizations
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Organization Members
CREATE POLICY "Users can view members in their organizations"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Subscription Plans
CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

-- Subscriptions
CREATE POLICY "Users can view their organization subscriptions"
  ON subscriptions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Chatbots
CREATE POLICY "Users can view chatbots in their organizations"
  ON chatbots FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Chats
CREATE POLICY "Users can view chats in their organizations"
  ON chats FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Messages
CREATE POLICY "Users can view messages in their organizations"
  ON messages FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Message Feedback
CREATE POLICY "Users can view feedback in their organizations"
  ON message_feedback FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Documents
CREATE POLICY "Users can view documents in their organizations"
  ON documents FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Document Embeddings
CREATE POLICY "Users can view embeddings in their organizations"
  ON document_embeddings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Statistics
CREATE POLICY "Users can view statistics in their organizations"
  ON statistics FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, description, price_monthly, price_yearly, features, max_chatbots, max_team_members, max_documents, max_storage_mb)
VALUES
  ('free', 'Free', 'For personal and small projects', 0, 0, 
   '{"features": ["1 chatbot", "1 team member", "5 documents", "50MB storage", "Basic analytics", "Community support"]}',
   1, 1, 5, 50),
  ('basic', 'Basic', 'For small businesses and startups', 29, 299, 
   '{"features": ["3 chatbots", "3 team members", "20 documents", "200MB storage", "Advanced analytics", "Email support", "Custom domain", "API access"]}',
   3, 3, 20, 200),
  ('premium', 'Premium', 'For growing businesses and teams', 79, 799,
   '{"features": ["10 chatbots", "10 team members", "100 documents", "1GB storage", "Advanced analytics", "Priority support", "Custom domain", "API access", "Custom branding", "Advanced RAG configuration"]}',
   10, 10, 100, 1024)
ON CONFLICT (id) DO NOTHING;