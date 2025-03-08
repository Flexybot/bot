/*
  # Analytics Schema and Functions

  1. New Tables
    - `statistics` - Daily aggregated statistics for chatbots
    - `message_feedback` - User feedback on chatbot responses
    - `analytics_events` - Raw analytics events for detailed tracking

  2. Functions
    - `update_message_stats` - Updates message statistics
    - `get_chatbot_feedback_stats` - Calculates feedback statistics
    - `get_top_questions` - Retrieves most common user questions

  3. Security
    - Enable RLS on all tables
    - Add policies for organization-based access
*/

-- Create statistics table for daily aggregated metrics
CREATE TABLE IF NOT EXISTS statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid NOT NULL,
  date date NOT NULL,
  total_messages integer DEFAULT 0,
  total_sessions integer DEFAULT 0,
  total_users integer DEFAULT 0,
  avg_response_time numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(chatbot_id, date),
  CONSTRAINT fk_chatbot
    FOREIGN KEY(chatbot_id) 
    REFERENCES chatbots(id)
    ON DELETE CASCADE
);

-- Create message feedback table
CREATE TABLE IF NOT EXISTS message_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid NOT NULL,
  message_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_helpful boolean NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id),
  CONSTRAINT fk_chatbot
    FOREIGN KEY(chatbot_id) 
    REFERENCES chatbots(id)
    ON DELETE CASCADE
);

-- Create analytics events table for raw event tracking
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid NOT NULL,
  session_id uuid NOT NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_chatbot
    FOREIGN KEY(chatbot_id) 
    REFERENCES chatbots(id)
    ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX idx_statistics_chatbot_date ON statistics(chatbot_id, date);
CREATE INDEX idx_feedback_chatbot ON message_feedback(chatbot_id);
CREATE INDEX idx_events_chatbot_session ON analytics_events(chatbot_id, session_id);
CREATE INDEX idx_events_type ON analytics_events(event_type);

-- Function to update message statistics
CREATE OR REPLACE FUNCTION update_message_stats(
  p_message_id uuid,
  p_is_helpful boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_chatbot_id uuid;
  v_response_time numeric;
BEGIN
  -- Get message details
  SELECT 
    chatbot_id,
    EXTRACT(EPOCH FROM (response_timestamp - created_at)) * 1000
  INTO v_chatbot_id, v_response_time
  FROM messages 
  WHERE id = p_message_id;

  -- Update daily statistics
  INSERT INTO statistics (
    chatbot_id,
    date,
    total_messages,
    total_sessions,
    avg_response_time
  )
  VALUES (
    v_chatbot_id,
    date_trunc('day', now())::date,
    1,
    1,
    COALESCE(v_response_time, 0)
  )
  ON CONFLICT (chatbot_id, date)
  DO UPDATE SET
    total_messages = statistics.total_messages + 1,
    avg_response_time = (statistics.avg_response_time * statistics.total_messages + 
      COALESCE(EXCLUDED.avg_response_time, 0)) / (statistics.total_messages + 1),
    updated_at = now();
END;
$$;

-- Function to get chatbot feedback statistics
CREATE OR REPLACE FUNCTION get_chatbot_feedback_stats(
  p_chatbot_id uuid,
  p_start_date timestamptz,
  p_end_date timestamptz
)
RETURNS TABLE (
  total bigint,
  upvotes bigint,
  downvotes bigint,
  upvote_percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH feedback_stats AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE is_helpful) as upvotes,
      COUNT(*) FILTER (WHERE NOT is_helpful) as downvotes
    FROM message_feedback
    WHERE chatbot_id = p_chatbot_id
    AND created_at BETWEEN p_start_date AND p_end_date
  )
  SELECT
    total,
    upvotes,
    downvotes,
    ROUND((upvotes::numeric / NULLIF(total, 0) * 100)::numeric, 2) as upvote_percentage
  FROM feedback_stats;
END;
$$;

-- Function to get top user questions
CREATE OR REPLACE FUNCTION get_top_questions(
  p_chatbot_id uuid,
  p_start_date timestamptz,
  p_end_date timestamptz,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  question text,
  count bigint,
  last_asked timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.content as question,
    COUNT(*) as count,
    MAX(m.created_at) as last_asked
  FROM messages m
  WHERE m.chatbot_id = p_chatbot_id
  AND m.role = 'user'
  AND m.created_at BETWEEN p_start_date AND p_end_date
  GROUP BY m.content
  ORDER BY count DESC, last_asked DESC
  LIMIT p_limit;
END;
$$;

-- RLS Policies

-- Statistics policies
CREATE POLICY "Users can view statistics for their chatbots"
  ON statistics FOR SELECT
  USING (
    chatbot_id IN (
      SELECT c.id FROM chatbots c
      INNER JOIN organization_members om 
        ON c.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert statistics for their chatbots"
  ON statistics FOR INSERT
  WITH CHECK (
    chatbot_id IN (
      SELECT c.id FROM chatbots c
      INNER JOIN organization_members om 
        ON c.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Message feedback policies
CREATE POLICY "Users can view feedback for their chatbots"
  ON message_feedback FOR SELECT
  USING (
    chatbot_id IN (
      SELECT c.id FROM chatbots c
      INNER JOIN organization_members om 
        ON c.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert feedback"
  ON message_feedback FOR INSERT
  WITH CHECK (
    chatbot_id IN (
      SELECT c.id FROM chatbots c
      INNER JOIN organization_members om 
        ON c.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Analytics events policies
CREATE POLICY "Users can view events for their chatbots"
  ON analytics_events FOR SELECT
  USING (
    chatbot_id IN (
      SELECT c.id FROM chatbots c
      INNER JOIN organization_members om 
        ON c.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert events"
  ON analytics_events FOR INSERT
  WITH CHECK (
    chatbot_id IN (
      SELECT c.id FROM chatbots c
      INNER JOIN organization_members om 
        ON c.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );