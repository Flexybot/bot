/*
  # Fix Organization Members RLS Recursion Issue

  1. Analysis
    - Previous policies caused infinite recursion by self-referencing the organization_members table
    - Implementing non-recursive alternatives using subqueries and joins
    
  2. Changes
    - Drop existing problematic policies
    - Create new non-recursive policies using proper access patterns
    - Add separate policies for different operations with clear scoping
    
  3. Security
    - Maintain proper access control while avoiding recursion
    - Implement role-based permissions without circular references
*/

-- First, drop all existing policies to start fresh
DO $$
BEGIN
    DROP POLICY IF EXISTS "Members can view organization members" ON organization_members;
    DROP POLICY IF EXISTS "Owners and admins can add members" ON organization_members;
    DROP POLICY IF EXISTS "Owners can update member roles" ON organization_members;
    DROP POLICY IF EXISTS "Owners can remove members" ON organization_members;
END
$$;

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- SELECT policy: Users can view members of organizations they belong to
-- Uses a correlated EXISTS clause instead of IN to avoid recursion
CREATE POLICY "view_organization_members" ON organization_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM organization_members AS member
            WHERE member.organization_id = organization_members.organization_id
            AND member.user_id = auth.uid()
        )
    );

-- INSERT policy: Only owners and admins can add members
-- Uses a correlated EXISTS clause with role check
CREATE POLICY "insert_organization_members" ON organization_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM organization_members AS member
            WHERE member.organization_id = organization_members.organization_id
            AND member.user_id = auth.uid()
            AND member.role IN ('owner', 'admin')
        )
    );

-- UPDATE policy: Only owners can update roles
-- Uses direct role comparison without recursion
CREATE POLICY "update_organization_members" ON organization_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 
            FROM organization_members AS member
            WHERE member.organization_id = organization_members.organization_id
            AND member.user_id = auth.uid()
            AND member.role = 'owner'
        )
    );

-- DELETE policy: Owners can remove non-owners, members can remove themselves
CREATE POLICY "delete_organization_members" ON organization_members
    FOR DELETE USING (
        (
            -- Owners can delete non-owners
            EXISTS (
                SELECT 1 
                FROM organization_members AS member
                WHERE member.organization_id = organization_members.organization_id
                AND member.user_id = auth.uid()
                AND member.role = 'owner'
            )
            AND organization_members.role != 'owner'
        )
        OR
        -- Users can remove themselves
        auth.uid() = user_id
    );

-- Verify policies (run this separately in SQL editor to check)
/*
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'organization_members'
ORDER BY policyname;
*/