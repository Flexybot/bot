/*
  # Fix organization members policy

  1. Changes
    - Safely add organization members policy only if it doesn't exist
    - Uses DO block to check for existing policy before creating
  
  2. Security
    - Maintains existing RLS policies if already present
    - Ensures policy is created only once
*/

DO $$ 
BEGIN
  -- Check if the policy already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'organization_members' 
      AND policyname = 'Members can view organization members'
  ) THEN
    -- Create the policy only if it doesn't exist
    CREATE POLICY "Members can view organization members" 
      ON organization_members
      FOR SELECT
      TO authenticated
      USING (
        auth.uid() IN (
          SELECT user_id 
          FROM organization_members 
          WHERE organization_id = organization_members.organization_id
        )
      );
  END IF;
END $$;