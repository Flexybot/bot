/*
  # Fix Chatbot Policies

  1. Changes
    - Safely drop existing policies if they exist
    - Recreate policies with proper checks
    - Add missing policies for chatbots table
    
  2. Security
    - Enable RLS on chatbots table
    - Add policies for viewing and managing chatbots
*/

-- First, safely drop existing policies
DO $$ 
BEGIN
  -- Drop chatbot policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chatbots' 
    AND policyname = 'Users can view chatbots in their organizations'
  ) THEN
    DROP POLICY "Users can view chatbots in their organizations" ON chatbots;
  END IF;
END $$;

-- Enable RLS on chatbots table if not already enabled
ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;

-- Create policies for chatbots
CREATE POLICY "Users can view chatbots in their organizations" ON chatbots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = chatbots.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage chatbots in their organizations" ON chatbots
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = chatbots.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin', 'member')
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chatbots_organization_id ON chatbots(organization_id);