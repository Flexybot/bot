/*
  # Add Organization Relationships

  1. Changes
    - Add organization_id and chatbot_id to chats table
    - Add organization_id and chatbot_id to documents table
    - Add organization_id to file_uploads table

  2. Security
    - Foreign key constraints with cascade delete
    - Updated RLS policies for organization-level access
*/

-- Add columns to chats table
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chats' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.chats 
    ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chats' AND column_name = 'chatbot_id'
  ) THEN
    ALTER TABLE public.chats 
    ADD COLUMN chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add columns to documents table
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.documents 
    ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'chatbot_id'
  ) THEN
    ALTER TABLE public.documents 
    ADD COLUMN chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add column to file_uploads table
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'file_uploads' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.file_uploads 
    ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update RLS policies for chats
DROP POLICY IF EXISTS "Users can view their own chats" ON chats;
CREATE POLICY "Users can view their organization's chats"
    ON chats FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Update RLS policies for documents
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
CREATE POLICY "Users can view their organization's documents"
    ON documents FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Update RLS policies for file_uploads
DROP POLICY IF EXISTS "Users can view their own files" ON file_uploads;
CREATE POLICY "Users can view their organization's files"
    ON file_uploads FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
        )
    );