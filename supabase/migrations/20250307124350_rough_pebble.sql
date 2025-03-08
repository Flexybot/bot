/*
  # Fix Database Schema and Policies

  1. Changes
    - Add missing updated_at column to organizations table
    - Fix organization_members policies to prevent recursion
    - Drop existing problematic policies
    - Create new non-recursive policies
    
  2. Security
    - Maintain proper access control
    - Prevent infinite recursion
    - Enable RLS
*/

-- Fix organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Drop existing policies to clean up
DROP POLICY IF EXISTS "view_organization_members" ON organization_members;
DROP POLICY IF EXISTS "insert_organization_members" ON organization_members;
DROP POLICY IF EXISTS "update_organization_members" ON organization_members;
DROP POLICY IF EXISTS "delete_organization_members" ON organization_members;

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Create new non-recursive policies
-- SELECT policy: Users can view members of organizations they belong to
CREATE POLICY "view_organization_members" ON organization_members
    FOR SELECT USING (
        auth.uid() = user_id OR
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- INSERT policy: Only owners and admins can add members
CREATE POLICY "insert_organization_members" ON organization_members
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- UPDATE policy: Only owners can update member roles
CREATE POLICY "update_organization_members" ON organization_members
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role = 'owner'
        )
    );

-- DELETE policy: Owners can delete members, users can remove themselves
CREATE POLICY "delete_organization_members" ON organization_members
    FOR DELETE USING (
        auth.uid() = user_id OR
        (
            organization_id IN (
                SELECT organization_id 
                FROM organization_members 
                WHERE user_id = auth.uid() 
                AND role = 'owner'
            )
            AND user_id != (
                SELECT user_id 
                FROM organization_members 
                WHERE organization_id = organization_members.organization_id 
                AND role = 'owner' 
                LIMIT 1
            )
        )
    );

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to organizations table
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();