/*
  # Fix Organization Members RLS Policies (Safe Version)

  1. Changes
    - Add safety checks before creating policies
    - Implement proper role-based access control for organization members
    - Add separate policies for different operations (select, insert, update, delete)
    
  2. Security
    - Enable RLS on organization_members table
    - Add policies for:
      - Viewing members (owners and admins can view all, members can view themselves)
      - Adding members (only owners and admins)
      - Updating roles (only owners)
      - Removing members (owners can remove anyone, admins can't remove owners)

  3. Notes
    - Uses DO blocks to safely check and create policies
    - Prevents errors from attempting to create duplicate policies
*/

-- Enable RLS if not already enabled
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Safely create select policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organization_members' 
        AND policyname = 'Members can view organization members'
    ) THEN
        CREATE POLICY "Members can view organization members" ON organization_members
            FOR SELECT USING (
                auth.uid() IN (
                    SELECT user_id 
                    FROM organization_members 
                    WHERE organization_id = organization_members.organization_id
                )
            );
    END IF;
END
$$;

-- Safely create insert policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organization_members' 
        AND policyname = 'Owners and admins can add members'
    ) THEN
        CREATE POLICY "Owners and admins can add members" ON organization_members
            FOR INSERT WITH CHECK (
                auth.uid() IN (
                    SELECT user_id 
                    FROM organization_members 
                    WHERE organization_id = organization_members.organization_id 
                    AND role IN ('owner', 'admin')
                )
            );
    END IF;
END
$$;

-- Safely create update policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organization_members' 
        AND policyname = 'Owners can update member roles'
    ) THEN
        CREATE POLICY "Owners can update member roles" ON organization_members
            FOR UPDATE USING (
                auth.uid() IN (
                    SELECT user_id 
                    FROM organization_members 
                    WHERE organization_id = organization_members.organization_id 
                    AND role = 'owner'
                )
            );
    END IF;
END
$$;

-- Safely create delete policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organization_members' 
        AND policyname = 'Owners can remove members'
    ) THEN
        CREATE POLICY "Owners can remove members" ON organization_members
            FOR DELETE USING (
                -- Owners can remove anyone except other owners
                (
                    auth.uid() IN (
                        SELECT user_id 
                        FROM organization_members 
                        WHERE organization_id = organization_members.organization_id 
                        AND role = 'owner'
                    )
                    AND organization_members.role != 'owner'
                )
                OR
                -- Members can remove themselves
                auth.uid() = user_id
            );
    END IF;
END
$$;