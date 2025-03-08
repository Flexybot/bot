/*
  # Create documents and embeddings tables

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, foreign key)
      - `chatbot_id` (uuid, foreign key, optional)
      - `title` (text)
      - `content` (text)
      - `type` (text)
      - `size_bytes` (bigint)
      - `embedding` (vector)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Functions
    - `match_documents`: Finds similar documents using cosine similarity
    
  3. Security
    - Enable RLS on documents table
    - Add policies for organization access
*/

-- Enable the vector extension if not already enabled
create extension if not exists vector with schema public;

-- Create documents table
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  chatbot_id uuid references public.chatbots(id) on delete set null,
  title text,
  content text not null,
  type text,
  size_bytes bigint,
  embedding vector(1536),
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes
create index if not exists documents_organization_id_idx on public.documents (organization_id);
create index if not exists documents_chatbot_id_idx on public.documents (chatbot_id);
create index if not exists documents_embedding_idx on public.documents using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Enable RLS
alter table public.documents enable row level security;

-- Policies for documents
create policy "Users can read documents in their organization"
  on public.documents
  for select
  using (
    organization_id in (
      select organization_id 
      from public.organization_members 
      where user_id = auth.uid()
    )
  );

create policy "Users can insert documents in their organization"
  on public.documents
  for insert
  with check (
    organization_id in (
      select organization_id 
      from public.organization_members 
      where user_id = auth.uid()
    )
  );

create policy "Users can update documents in their organization"
  on public.documents
  for update
  using (
    organization_id in (
      select organization_id 
      from public.organization_members 
      where user_id = auth.uid()
    )
  );

create policy "Users can delete documents in their organization"
  on public.documents
  for delete
  using (
    organization_id in (
      select organization_id 
      from public.organization_members 
      where user_id = auth.uid()
    )
  );

-- Function to match similar documents
create or replace function public.match_documents(
  query_embedding vector(1536),
  similarity_threshold float,
  match_count int,
  organization_filter uuid,
  chatbot_filter uuid default null
)
returns table (
  id uuid,
  content text,
  title text,
  similarity float
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.title,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 
    documents.organization_id = organization_filter
    and (chatbot_filter is null or documents.chatbot_id = chatbot_filter)
    and 1 - (documents.embedding <=> query_embedding) > similarity_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;