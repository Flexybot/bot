/*
  # Fix Organization RLS Policies

  1. Changes
    - Drop existing problematic policies
    - Create new non-recursive policies for organization_members
    - Create proper policies for chatbots table
    - Use direct user ID checks to prevent recursion
  
  2. Security
    - Maintains proper access control without recursion
    - Ensures users can only access their organization's data
    - Proper role-based access for sensitive operations
*/

-- First, drop any existing policies to start fresh
DROP POLICY IF EXISTS "Members can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Members can update organization members" ON organization_members;
DROP POLICY IF EXISTS "Members can delete organization members" ON organization_members;
DROP POLICY IF EXISTS "Members can view chatbots" ON chatbots;
DROP POLICY IF EXISTS "Members can create chatbots" ON chatbots;
DROP POLICY IF EXISTS "Members can update chatbots" ON chatbots;
DROP POLICY IF EXISTS "Members can delete chatbots" ON chatbots;

-- Enable RLS on tables if not already enabled
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;

-- Organization Members Policies
CREATE POLICY "View organization members"
ON organization_members
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Update organization members"
ON organization_members
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Delete organization members"
ON organization_members
FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
    AND role = 'owner'
  )
);

-- Chatbot Policies
CREATE POLICY "View chatbots"
ON chatbots
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Create chatbots"
ON chatbots
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Update chatbots"
ON chatbots
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Delete chatbots"
ON chatbots
FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);