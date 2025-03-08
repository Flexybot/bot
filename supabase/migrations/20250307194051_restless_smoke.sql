/*
  # Initial Schema Setup

  1. New Tables
    - `chatbots`
      - Basic chatbot configuration and settings
    - `messages` 
      - Chat message history
    - `documents`
      - Knowledge base documents
    - `organization_members`
      - Organization membership and roles
    
  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
*/

-- Create chatbots table
CREATE TABLE IF NOT EXISTS chatbots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  avatar_url text,
  system_prompt text,
  welcome_message text,
  temperature float DEFAULT 0.7,
  model text DEFAULT 'gpt-3.5-turbo',
  is_active boolean DEFAULT true,
  use_rag boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  chatbot_id uuid NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  chatbot_id uuid REFERENCES chatbots(id) ON DELETE CASCADE,
  title text,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  type text,
  size_in_bytes bigint NOT NULL,
  embedding vector(1536),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create organization_members table if not exists
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Chatbots policies
CREATE POLICY "Users can view their organization's chatbots"
  ON chatbots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = chatbots.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage chatbots"
  ON chatbots
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = chatbots.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Messages policies
CREATE POLICY "Users can view their organization's messages"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = messages.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their organizations"
  ON messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = messages.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Documents policies
CREATE POLICY "Users can view their organization's documents"
  ON documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = documents.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage documents"
  ON documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = documents.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Organization members policies
CREATE POLICY "Users can view members in their organizations"
  ON organization_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members members
      WHERE members.organization_id = organization_members.organization_id
      AND members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage members"
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chatbots_organization_id ON chatbots(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_organization_id ON messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_chatbot_id ON messages(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_documents_organization_id ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_chatbot_id ON documents(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);