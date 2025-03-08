/*
  # Create message feedback table

  1. New Tables
    - `message_feedback`
      - `id` (uuid, primary key)
      - `message_id` (uuid)
      - `chat_id` (uuid)
      - `user_id` (uuid)
      - `is_helpful` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for user access
*/

-- Create message feedback table
create table if not exists public.message_feedback (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null,
  chat_id uuid not null,
  user_id uuid not null,
  is_helpful boolean not null,
  created_at timestamptz default now()
);

-- Create indexes
create index if not exists message_feedback_message_id_idx on public.message_feedback (message_id);
create index if not exists message_feedback_chat_id_idx on public.message_feedback (chat_id);
create index if not exists message_feedback_user_id_idx on public.message_feedback (user_id);

-- Enable RLS
alter table public.message_feedback enable row level security;

-- Policies for message feedback
create policy "Users can insert their own feedback"
  on public.message_feedback
  for insert
  with check (user_id = auth.uid());

create policy "Users can read their own feedback"
  on public.message_feedback
  for select
  using (user_id = auth.uid());

create policy "Users can update their own feedback"
  on public.message_feedback
  for update
  using (user_id = auth.uid());

create policy "Users can delete their own feedback"
  on public.message_feedback
  for delete
  using (user_id = auth.uid());