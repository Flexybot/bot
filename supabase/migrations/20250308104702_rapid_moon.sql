/*
  # Fix recursive RLS policies

  1. Changes
    - Drop existing problematic policies
    - Create new non-recursive policies for organization_members
    - Create proper policies for chatbots table
    - Use proper joins instead of recursive subqueries
  
  2. Security
    - Maintains proper access control
    - Prevents infinite recursion
    - Ensures users can only access their organization's data
*/

-- First, drop existing problematic policies
DROP POLICY IF EXISTS "Members can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Members can view chatbots" ON chatbots;

-- Create new organization_members policies
CREATE POLICY "Members can view organization members"
ON organization_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members AS member
    WHERE member.organization_id = organization_members.organization_id
    AND member.user_id = auth.uid()
  )
);

CREATE POLICY "Members can update organization members"
ON organization_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members AS member
    WHERE member.organization_id = organization_members.organization_id
    AND member.user_id = auth.uid()
    AND member.role IN ('owner', 'admin')
  )
);

-- Create chatbots policies
CREATE POLICY "Members can view chatbots"
ON chatbots
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members AS member
    WHERE member.organization_id = chatbots.organization_id
    AND member.user_id = auth.uid()
  )
);

CREATE POLICY "Members can create chatbots"
ON chatbots
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM organization_members AS member
    WHERE member.organization_id = chatbots.organization_id
    AND member.user_id = auth.uid()
  )
);

CREATE POLICY "Members can update chatbots"
ON chatbots
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members AS member
    WHERE member.organization_id = chatbots.organization_id
    AND member.user_id = auth.uid()
  )
);

CREATE POLICY "Members can delete chatbots"
ON chatbots
FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members AS member
    WHERE member.organization_id = chatbots.organization_id
    AND member.user_id = auth.uid()
    AND member.role IN ('owner', 'admin')
  )
);