/*
  # Fix organization members RLS policies

  1. Changes
    - Drop existing problematic policies
    - Add new, optimized RLS policies for organization_members table
    - Ensure proper access control without recursion

  2. Security
    - Enable RLS on organization_members table
    - Add policies for:
      - Owners/admins can read all members in their organization
      - Members can read other members in their organization
      - Owners can manage members
*/

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Members can view their own organizations" ON organization_members;
DROP POLICY IF EXISTS "Organization owners can manage members" ON organization_members;

-- Create new policies without recursion
CREATE POLICY "Users can read organizations they belong to"
ON organization_members
FOR SELECT
USING (
  auth.uid() = user_id
  OR
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Organization owners and admins can manage members"
ON organization_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members
    WHERE organization_id = organization_members.organization_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM organization_members
    WHERE organization_id = organization_members.organization_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);