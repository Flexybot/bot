/*
  # Create message statistics function

  1. Functions
    - `update_message_stats`: Updates message statistics when feedback is given
    
  2. Changes
    - Adds helpful/unhelpful counts to messages table
    - Creates function to update these counts
*/

-- Add statistics columns to messages table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'helpful_count'
  ) THEN
    ALTER TABLE messages 
    ADD COLUMN helpful_count integer DEFAULT 0,
    ADD COLUMN unhelpful_count integer DEFAULT 0;
  END IF;
END $$;

-- Create function to update message statistics
CREATE OR REPLACE FUNCTION update_message_stats(
  p_message_id uuid,
  p_is_helpful boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the appropriate counter
  IF p_is_helpful THEN
    UPDATE messages 
    SET helpful_count = helpful_count + 1
    WHERE id = p_message_id;
  ELSE
    UPDATE messages 
    SET unhelpful_count = unhelpful_count + 1
    WHERE id = p_message_id;
  END IF;
END;
$$;