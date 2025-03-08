/*
  # Fix Policies and Add Missing Tables

  1. Changes
    - Drop existing policies if they exist
    - Recreate policies with IF NOT EXISTS
    - Add missing tables and relationships
    
  2. Security
    - Ensure RLS is enabled
    - Add proper policies for all tables
*/

-- First, safely drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop policies for organizations table
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organizations' 
    AND policyname = 'Users can view organizations they are members of'
  ) THEN
    DROP POLICY "Users can view organizations they are members of" ON organizations;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organizations' 
    AND policyname = 'Organization owners and admins can update their organizations'
  ) THEN
    DROP POLICY "Organization owners and admins can update their organizations" ON organizations;
  END IF;

  -- Drop policies for organization_members table
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organization_members' 
    AND policyname = 'Users can view members of their organizations'
  ) THEN
    DROP POLICY "Users can view members of their organizations" ON organization_members;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organization_members' 
    AND policyname = 'Organization owners and admins can manage members'
  ) THEN
    DROP POLICY "Organization owners and admins can manage members" ON organization_members;
  END IF;
END $$;

-- Create chatbots table if it doesn't exist
CREATE TABLE IF NOT EXISTS chatbots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  model text NOT NULL DEFAULT 'gpt-3.5-turbo',
  welcome_message text NOT NULL DEFAULT 'Hello! How can I help you today?',
  system_prompt text NOT NULL DEFAULT 'You are a helpful assistant.',
  temperature numeric NOT NULL DEFAULT 0.7,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create conversations table if it doesn't exist
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid REFERENCES chatbots(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Recreate policies for organizations
CREATE POLICY "Users can view organizations they are members of" ON organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners and admins can update their organizations" ON organizations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Recreate policies for organization_members
CREATE POLICY "Users can view members of their organizations" ON organization_members
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners and admins can manage members" ON organization_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_members.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Add policies for chatbots
CREATE POLICY "Users can view chatbots in their organizations" ON chatbots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = chatbots.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can manage chatbots" ON chatbots
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = chatbots.organization_id
      AND user_id = auth.uid()
    )
  );

-- Add policies for conversations
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM chatbots
      JOIN organization_members ON chatbots.organization_id = organization_members.organization_id
      WHERE chatbots.id = conversations.chatbot_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chatbots
      WHERE id = conversations.chatbot_id
      AND is_active = true
    )
  );

-- Add policies for messages
CREATE POLICY "Users can view messages from their conversations" ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM chatbots
          JOIN organization_members ON chatbots.organization_id = organization_members.organization_id
          WHERE chatbots.id = conversations.chatbot_id
          AND organization_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create messages in their conversations" ON messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chatbots_org_id ON chatbots(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_chatbot_id ON conversations(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);