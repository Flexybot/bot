/*
  # Fix Chatbots RLS Policies

  1. Changes
    - Drop all existing policies
    - Create optimized policies for chatbots table
    - Enable RLS on chatbots table
  
  2. Security
    - Members can read chatbots in their organizations
    - Only owners/admins can modify chatbots
*/

-- Enable RLS
ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "chatbots_read" ON chatbots;
DROP POLICY IF EXISTS "chatbots_insert" ON chatbots;
DROP POLICY IF EXISTS "chatbots_update" ON chatbots;
DROP POLICY IF EXISTS "chatbots_delete" ON chatbots;

-- Create new policies

-- Allow members to read chatbots
CREATE POLICY "chatbots_read"
  ON chatbots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM organization_members 
      WHERE organization_id = chatbots.organization_id 
      AND user_id = auth.uid()
    )
  );

-- Allow owners/admins to insert chatbots
CREATE POLICY "chatbots_insert"
  ON chatbots
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM organization_members 
      WHERE organization_id = chatbots.organization_id 
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Allow owners/admins to update chatbots
CREATE POLICY "chatbots_update"
  ON chatbots
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 
      FROM organization_members 
      WHERE organization_id = chatbots.organization_id 
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Allow owners/admins to delete chatbots
CREATE POLICY "chatbots_delete"
  ON chatbots
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM organization_members 
      WHERE organization_id = chatbots.organization_id 
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );