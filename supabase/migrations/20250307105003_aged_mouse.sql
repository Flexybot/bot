/*
  # Create Chatbots Schema

  1. New Tables
    - `chatbots`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `organization_id` (uuid, foreign key)
      - `model` (text)
      - `welcome_message` (text)
      - `system_prompt` (text)
      - `temperature` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `status` (text)

  2. Security
    - Enable RLS on chatbots table
    - Add policies for organization members to manage their chatbots
*/

-- Create chatbots table
CREATE TABLE IF NOT EXISTS chatbots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  model text NOT NULL,
  welcome_message text NOT NULL DEFAULT 'Hello! How can I help you today?',
  system_prompt text NOT NULL DEFAULT 'You are a helpful assistant.',
  temperature numeric NOT NULL DEFAULT 0.7,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Organization members can view chatbots"
  ON chatbots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = chatbots.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can create chatbots"
  ON chatbots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = chatbots.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can update their chatbots"
  ON chatbots
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = chatbots.organization_id
      AND organization_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = chatbots.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can delete their chatbots"
  ON chatbots
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = chatbots.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chatbots_updated_at
  BEFORE UPDATE ON chatbots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();