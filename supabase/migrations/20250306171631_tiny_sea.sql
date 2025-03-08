/*
  # Add Organization Relationships and File Uploads Table

  1. New Tables
    - `file_uploads`
      - `id` (uuid, primary key)
      - `filename` (text)
      - `path` (text)
      - `size` (integer)
      - `mime_type` (text)
      - `organization_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes
    - Add organization_id and chatbot_id to chats table
    - Add organization_id and chatbot_id to documents table

  3. Security
    - Enable RLS on file_uploads table
    - Foreign key constraints with cascade delete
    - Updated RLS policies for organization-level access
*/

-- Create file_uploads table
CREATE TABLE IF NOT EXISTS public.file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    path TEXT NOT NULL,
    size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on file_uploads
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

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

-- Create RLS policies for file_uploads
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

CREATE POLICY "Users can upload files to their organization"
    ON file_uploads FOR INSERT
    TO authenticated
    WITH CHECK (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

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