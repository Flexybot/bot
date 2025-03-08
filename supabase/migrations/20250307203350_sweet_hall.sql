/*
  # Add RAG support to chatbots

  1. Changes
    - Add use_rag boolean column to chatbots table with default value true
    - Add comment explaining the column's purpose

  2. Notes
    - Default is true since most chatbots will want to use RAG
    - Column is nullable to maintain compatibility with existing records
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chatbots' AND column_name = 'use_rag'
  ) THEN
    ALTER TABLE chatbots 
    ADD COLUMN use_rag boolean DEFAULT true;

    COMMENT ON COLUMN chatbots.use_rag IS 
      'Whether this chatbot uses Retrieval Augmented Generation (RAG) with knowledge base documents';
  END IF;
END $$;