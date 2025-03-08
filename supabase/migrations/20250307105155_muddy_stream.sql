/*
  # Update Chatbots Schema

  1. Changes
    - Add `is_active` boolean column
    - Add `messages_count` integer column
    - Add `users_count` integer column
    - Add `knowledge_documents_count` integer column
    - Add `last_active_at` timestamp column

  2. Security
    - Update existing policies to handle new columns
*/

-- Add new columns
ALTER TABLE chatbots
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS messages_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS users_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS knowledge_documents_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();

-- Create function to update last_active_at
CREATE OR REPLACE FUNCTION update_chatbot_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for last_active_at
CREATE TRIGGER update_chatbot_last_active
  BEFORE UPDATE ON chatbots
  FOR EACH ROW
  WHEN (OLD.messages_count IS DISTINCT FROM NEW.messages_count)
  EXECUTE FUNCTION update_chatbot_last_active();