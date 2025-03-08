/*
  # Fix Feedback Stats Function

  1. Changes
    - Drop existing get_chatbot_feedback_stats function
    - Recreate function with updated return type
    - Add security definer to function

  2. Security
    - Function runs with definer security
    - Access controlled through RLS policies
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_chatbot_feedback_stats(uuid, timestamptz, timestamptz, uuid);

-- Recreate function with updated return type
CREATE OR REPLACE FUNCTION get_chatbot_feedback_stats(
  org_id UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  bot_id UUID DEFAULT NULL
)
RETURNS TABLE (
  chatbot_id UUID,
  chatbot_name TEXT,
  total_messages BIGINT,
  helpful_count BIGINT,
  unhelpful_count BIGINT,
  helpful_percentage INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH feedback_data AS (
    SELECT
      c.chatbot_id,
      cb.name AS chatbot_name,
      COUNT(m.id) AS total_messages,
      COUNT(mf.id) FILTER (WHERE mf.is_helpful = true) AS helpful_count,
      COUNT(mf.id) FILTER (WHERE mf.is_helpful = false) AS unhelpful_count
    FROM
      messages m
      JOIN chats c ON m.chat_id = c.id
      JOIN chatbots cb ON c.chatbot_id = cb.id
      LEFT JOIN message_feedback mf ON m.id = mf.message_id
    WHERE
      c.organization_id = org_id
      AND (bot_id IS NULL OR c.chatbot_id = bot_id)
      AND m.created_at >= start_date
      AND m.created_at <= end_date
      AND m.role = 'assistant'
    GROUP BY
      c.chatbot_id,
      cb.name
  )
  SELECT
    fd.chatbot_id,
    fd.chatbot_name,
    fd.total_messages,
    fd.helpful_count,
    fd.unhelpful_count,
    CASE
      WHEN fd.total_messages > 0 THEN
        ROUND((fd.helpful_count::NUMERIC / NULLIF(fd.helpful_count + fd.unhelpful_count, 0)::NUMERIC) * 100)::INTEGER
      ELSE 0
    END AS helpful_percentage
  FROM
    feedback_data fd
  ORDER BY
    fd.total_messages DESC;
END;
$$;

-- Revoke public access and grant to authenticated users
REVOKE ALL ON FUNCTION get_chatbot_feedback_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_chatbot_feedback_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID) TO authenticated;