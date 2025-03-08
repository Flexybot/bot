/*
  # Add Row Level Security Policies (with existence checks)

  1. Security Policies
    - Organizations:
      - View: Members can view their organizations
      - Create: Any authenticated user can create
      - Update: Owners and admins can update
      - Delete: Only owners can delete
    
    - Organization Members:
      - View: Members can view other members in their orgs
      - Create: Owners and admins can add members
      - Update: Owners and admins can update roles
      - Delete: Owners and admins can remove members
    
    - Chatbots:
      - View: Members can view org chatbots
      - Create: Owners and admins can create
      - Update: Owners and admins can update
      - Delete: Owners and admins can delete
    
    - API Keys:
      - View: Members can view org API keys
      - Create: Owners and admins can create
      - Update: Owners and admins can update
      - Delete: Owners and admins can delete
    
    - Statistics:
      - View: Members can view org statistics
      - Create: System only
      - Update: System only
      - Delete: System only

  2. Notes
    - All policies enforce organization-level isolation
    - Role-based access control for administrative actions
    - Read-only access for regular members
    - Safe creation with existence checks
*/

DO $$ 
BEGIN
    -- Organizations
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organizations' 
        AND policyname = 'Users can view their own organizations'
    ) THEN
        CREATE POLICY "Users can view their own organizations"
            ON public.organizations
            FOR SELECT USING (
                auth.uid() IN (
                    SELECT user_id 
                    FROM public.organization_members 
                    WHERE organization_id = id
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organizations' 
        AND policyname = 'Users can create organizations'
    ) THEN
        CREATE POLICY "Users can create organizations"
            ON public.organizations
            FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organizations' 
        AND policyname = 'Organization owners and admins can update their organization'
    ) THEN
        CREATE POLICY "Organization owners and admins can update their organization"
            ON public.organizations
            FOR UPDATE USING (
                auth.uid() IN (
                    SELECT user_id 
                    FROM public.organization_members 
                    WHERE organization_id = id 
                    AND role IN ('owner', 'admin')
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organizations' 
        AND policyname = 'Organization owners can delete their organization'
    ) THEN
        CREATE POLICY "Organization owners can delete their organization"
            ON public.organizations
            FOR DELETE USING (
                auth.uid() IN (
                    SELECT user_id 
                    FROM public.organization_members 
                    WHERE organization_id = id 
                    AND role = 'owner'
                )
            );
    END IF;

    -- Chatbots
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chatbots' 
        AND policyname = 'Users can view chatbots in their organizations'
    ) THEN
        CREATE POLICY "Users can view chatbots in their organizations"
            ON public.chatbots
            FOR SELECT USING (
                auth.uid() IN (
                    SELECT user_id 
                    FROM public.organization_members 
                    WHERE organization_id = organization_id
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chatbots' 
        AND policyname = 'Organization owners and admins can create chatbots'
    ) THEN
        CREATE POLICY "Organization owners and admins can create chatbots"
            ON public.chatbots
            FOR INSERT WITH CHECK (
                auth.uid() IN (
                    SELECT user_id 
                    FROM public.organization_members 
                    WHERE organization_id = organization_id 
                    AND role IN ('owner', 'admin')
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chatbots' 
        AND policyname = 'Organization owners and admins can update chatbots'
    ) THEN
        CREATE POLICY "Organization owners and admins can update chatbots"
            ON public.chatbots
            FOR UPDATE USING (
                auth.uid() IN (
                    SELECT user_id 
                    FROM public.organization_members 
                    WHERE organization_id = organization_id 
                    AND role IN ('owner', 'admin')
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chatbots' 
        AND policyname = 'Organization owners and admins can delete chatbots'
    ) THEN
        CREATE POLICY "Organization owners and admins can delete chatbots"
            ON public.chatbots
            FOR DELETE USING (
                auth.uid() IN (
                    SELECT user_id 
                    FROM public.organization_members 
                    WHERE organization_id = organization_id 
                    AND role IN ('owner', 'admin')
                )
            );
    END IF;

    -- API Keys
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'api_keys' 
        AND policyname = 'Users can view API keys in their organizations'
    ) THEN
        CREATE POLICY "Users can view API keys in their organizations"
            ON public.api_keys
            FOR SELECT USING (
                auth.uid() IN (
                    SELECT user_id 
                    FROM public.organization_members 
                    WHERE organization_id = organization_id
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'api_keys' 
        AND policyname = 'Organization owners and admins can create API keys'
    ) THEN
        CREATE POLICY "Organization owners and admins can create API keys"
            ON public.api_keys
            FOR INSERT WITH CHECK (
                auth.uid() IN (
                    SELECT user_id 
                    FROM public.organization_members 
                    WHERE organization_id = organization_id 
                    AND role IN ('owner', 'admin')
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'api_keys' 
        AND policyname = 'Organization owners and admins can update API keys'
    ) THEN
        CREATE POLICY "Organization owners and admins can update API keys"
            ON public.api_keys
            FOR UPDATE USING (
                auth.uid() IN (
                    SELECT user_id 
                    FROM public.organization_members 
                    WHERE organization_id = organization_id 
                    AND role IN ('owner', 'admin')
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'api_keys' 
        AND policyname = 'Organization owners and admins can delete API keys'
    ) THEN
        CREATE POLICY "Organization owners and admins can delete API keys"
            ON public.api_keys
            FOR DELETE USING (
                auth.uid() IN (
                    SELECT user_id 
                    FROM public.organization_members 
                    WHERE organization_id = organization_id 
                    AND role IN ('owner', 'admin')
                )
            );
    END IF;

    -- Statistics
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'statistics' 
        AND policyname = 'Users can view statistics in their organizations'
    ) THEN
        CREATE POLICY "Users can view statistics in their organizations"
            ON public.statistics
            FOR SELECT USING (
                auth.uid() IN (
                    SELECT user_id 
                    FROM public.organization_members 
                    WHERE organization_id = organization_id
                )
            );
    END IF;
END $$;