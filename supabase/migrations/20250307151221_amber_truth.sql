/*
  # Create documents and embeddings tables

  1. New Tables
    - `documents`
      - Stores document content and metadata
      - Includes vector embeddings for similarity search
    
  2. Functions
    - `match_documents`: Performs similarity search on document embeddings
    
  3. Security
    - Enable RLS on documents table
    - Add policies for document access
*/

-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  chatbot_id uuid REFERENCES chatbots(id) ON DELETE SET NULL,
  title text,
  content text NOT NULL,
  type text,
  source_url text,
  metadata jsonb,
  embedding vector(1536),
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS documents_organization_id_idx ON documents(organization_id);
CREATE INDEX IF NOT EXISTS documents_chatbot_id_idx ON documents(chatbot_id);
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read documents in their organization"
  ON documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = documents.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert documents in their organization"
  ON documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = documents.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can update documents in their organization"
  ON documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = documents.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can delete documents in their organization"
  ON documents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = documents.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Create function for similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_conditions jsonb DEFAULT '[]'::jsonb
)
RETURNS TABLE (
  id uuid,
  content text,
  title text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.title,
    jsonb_build_object(
      'type', d.type,
      'source_url', d.source_url,
      'metadata', d.metadata
    ) as metadata,
    1 - (d.embedding <=> query_embedding) as similarity
  FROM documents d
  WHERE 1 - (d.embedding <=> query_embedding) > match_threshold
  AND CASE 
    WHEN filter_conditions::jsonb != '[]'::jsonb THEN
      filter_conditions::jsonb @> jsonb_build_array(
        jsonb_build_object(
          'name', 'organization_id',
          'value', d.organization_id::text
        )
      )
      AND (
        NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements(filter_conditions) as f
          WHERE f->>'name' = 'chatbot_id'
        )
        OR filter_conditions::jsonb @> jsonb_build_array(
          jsonb_build_object(
            'name', 'chatbot_id',
            'value', d.chatbot_id::text
          )
        )
      )
    ELSE true
  END
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;