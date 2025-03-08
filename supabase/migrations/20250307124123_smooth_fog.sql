/*
  # Fix Organization Members Policies with Existence Checks

  1. Changes
    - Add existence checks before creating policies
    - Use DO blocks to safely handle policy creation
    - Maintain same security rules with safer implementation
    
  2. Security
    - Preserve existing security model
    - Ensure policies are created only if they don't exist
    - Keep RLS enabled
*/

-- Enable RLS if not already enabled
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Safely create SELECT policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organization_members' 
        AND policyname = 'view_organization_members'
    ) THEN
        CREATE POLICY "view_organization_members" ON organization_members
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 
                    FROM organization_members AS member
                    WHERE member.organization_id = organization_members.organization_id
                    AND member.user_id = auth.uid()
                )
            );
    END IF;
END
$$;

-- Safely create INSERT policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organization_members' 
        AND policyname = 'insert_organization_members'
    ) THEN
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
    END IF;
END
$$;

-- Safely create UPDATE policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organization_members' 
        AND policyname = 'update_organization_members'
    ) THEN
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
    END IF;
END
$$;

-- Safely create DELETE policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organization_members' 
        AND policyname = 'delete_organization_members'
    ) THEN
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
    END IF;
END
$$;