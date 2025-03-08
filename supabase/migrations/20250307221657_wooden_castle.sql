/*
  # Create chatbots schema

  1. New Tables
    - `chatbots`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, nullable)
      - `avatar_url` (text, nullable)
      - `system_prompt` (text)
      - `welcome_message` (text, nullable)
      - `temperature` (float)
      - `model` (text)
      - `is_active` (boolean)
      - `use_rag` (boolean)
      - `organization_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `chatbots` table
    - Add policies for CRUD operations based on organization membership
*/

-- Create chatbots table
CREATE TABLE IF NOT EXISTS chatbots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar_url text,
  system_prompt text NOT NULL DEFAULT 'You are a helpful AI assistant.',
  welcome_message text DEFAULT 'Hello! How can I help you today?',
  temperature float NOT NULL DEFAULT 0.7,
  model text NOT NULL DEFAULT 'gpt-3.5-turbo',
  is_active boolean NOT NULL DEFAULT true,
  use_rag boolean NOT NULL DEFAULT true,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_temperature CHECK (temperature >= 0 AND temperature <= 1)
);

-- Enable RLS
ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view chatbots in their organization"
  ON chatbots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = chatbots.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chatbots in their organization"
  ON chatbots
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = chatbots.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update chatbots in their organization"
  ON chatbots
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = chatbots.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete chatbots in their organization"
  ON chatbots
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = chatbots.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Create indexes
CREATE INDEX chatbots_organization_id_idx ON chatbots(organization_id);
CREATE INDEX chatbots_created_at_idx ON chatbots(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_chatbots_updated_at
  BEFORE UPDATE ON chatbots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();