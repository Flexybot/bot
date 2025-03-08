/*
  # Base Schema Setup

  1. New Tables
    - `organizations` - Organization details
    - `organization_members` - Organization membership and roles
    - `chatbots` - Chatbot configurations
    - `messages` - Chat message history
    - `message_feedback` - User feedback on responses
    - `documents` - Knowledge base documents
    - `document_embeddings` - Vector embeddings for documents

  2. Security
    - Enable RLS on all tables
    - Add policies for organization-based access

  3. Functions
    - `match_documents` - Similarity search for documents
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

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create message feedback table
CREATE TABLE IF NOT EXISTS message_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
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

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_chatbots_org ON chatbots(organization_id);
CREATE INDEX idx_messages_chatbot ON messages(chatbot_id);
CREATE INDEX idx_messages_org ON messages(organization_id);
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_feedback_message ON message_feedback(message_id);
CREATE INDEX idx_feedback_chatbot ON message_feedback(chatbot_id);
CREATE INDEX idx_feedback_org ON message_feedback(organization_id);
CREATE INDEX idx_documents_org ON documents(organization_id);
CREATE INDEX idx_documents_chatbot ON documents(chatbot_id);
CREATE INDEX idx_embeddings_document ON document_embeddings(document_id);
CREATE INDEX idx_embeddings_org ON document_embeddings(organization_id);
CREATE INDEX idx_embeddings_chatbot ON document_embeddings(chatbot_id);

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

CREATE POLICY "Organization owners can update their organizations"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role = 'owner'
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

CREATE POLICY "Organization admins can manage members"
  ON organization_members FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
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

CREATE POLICY "Users can manage chatbots in their organizations"
  ON chatbots FOR ALL
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

CREATE POLICY "Users can create messages in their organizations"
  ON messages FOR INSERT
  WITH CHECK (
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

CREATE POLICY "Users can create feedback in their organizations"
  ON message_feedback FOR INSERT
  WITH CHECK (
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

CREATE POLICY "Users can manage documents in their organizations"
  ON documents FOR ALL
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

CREATE POLICY "Users can manage embeddings in their organizations"
  ON document_embeddings FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );