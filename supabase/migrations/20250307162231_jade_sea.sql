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
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  chatbot_id uuid NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  date date NOT NULL,
  total_messages integer DEFAULT 0,
  total_sessions integer DEFAULT 0,
  total_users integer DEFAULT 0,
  avg_response_time numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(chatbot_id, date)
);

-- Create message feedback table
CREATE TABLE IF NOT EXISTS message_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  chatbot_id uuid NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  message_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_helpful boolean NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Create analytics events table for raw event tracking
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  chatbot_id uuid NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX idx_statistics_org_date ON statistics(organization_id, date);
CREATE INDEX idx_statistics_chatbot_date ON statistics(chatbot_id, date);
CREATE INDEX idx_feedback_org_chatbot ON message_feedback(organization_id, chatbot_id);
CREATE INDEX idx_events_org_type ON analytics_events(organization_id, event_type);
CREATE INDEX idx_events_chatbot_session ON analytics_events(chatbot_id, session_id);

-- Function to update message statistics
CREATE OR REPLACE FUNCTION update_message_stats(
  p_message_id uuid,
  p_is_helpful boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update daily statistics
  INSERT INTO statistics (
    organization_id,
    chatbot_id,
    date,
    total_messages,
    total_sessions,
    avg_response_time
  )
  VALUES (
    (SELECT organization_id FROM messages WHERE id = p_message_id),
    (SELECT chatbot_id FROM messages WHERE id = p_message_id),
    date_trunc('day', now())::date,
    1,
    1,
    (SELECT response_time FROM messages WHERE id = p_message_id)
  )
  ON CONFLICT (chatbot_id, date)
  DO UPDATE SET
    total_messages = statistics.total_messages + 1,
    avg_response_time = (statistics.avg_response_time * statistics.total_messages + 
      EXCLUDED.avg_response_time) / (statistics.total_messages + 1),
    updated_at = now();
END;
$$;

-- Function to get chatbot feedback statistics
CREATE OR REPLACE FUNCTION get_chatbot_feedback_stats(
  org_id uuid,
  start_date timestamptz,
  end_date timestamptz,
  bot_id uuid DEFAULT NULL
)
RETURNS TABLE (
  chatbot_id uuid,
  chatbot_name text,
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
      f.chatbot_id,
      c.name as chatbot_name,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE f.is_helpful) as upvotes,
      COUNT(*) FILTER (WHERE NOT f.is_helpful) as downvotes
    FROM message_feedback f
    JOIN chatbots c ON c.id = f.chatbot_id
    WHERE f.organization_id = org_id
    AND f.created_at BETWEEN start_date AND end_date
    AND (bot_id IS NULL OR f.chatbot_id = bot_id)
    GROUP BY f.chatbot_id, c.name
  )
  SELECT
    chatbot_id,
    chatbot_name,
    total,
    upvotes,
    downvotes,
    ROUND((upvotes::numeric / NULLIF(total, 0) * 100)::numeric, 2) as upvote_percentage
  FROM feedback_stats;
END;
$$;

-- Function to get top user questions
CREATE OR REPLACE FUNCTION get_top_questions(
  org_id uuid,
  start_date timestamptz,
  end_date timestamptz,
  bot_id uuid DEFAULT NULL,
  limit_count integer DEFAULT 10
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
  WHERE m.organization_id = org_id
  AND m.role = 'user'
  AND m.created_at BETWEEN start_date AND end_date
  AND (bot_id IS NULL OR m.chatbot_id = bot_id)
  GROUP BY m.content
  ORDER BY count DESC, last_asked DESC
  LIMIT limit_count;
END;
$$;

-- RLS Policies

-- Statistics policies
CREATE POLICY "Statistics are viewable by organization members"
  ON statistics FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Statistics are insertable by organization members"
  ON statistics FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Message feedback policies
CREATE POLICY "Feedback is viewable by organization members"
  ON message_feedback FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Feedback is insertable by anyone"
  ON message_feedback FOR INSERT
  WITH CHECK (true);

-- Analytics events policies
CREATE POLICY "Events are viewable by organization members"
  ON analytics_events FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Events are insertable by anyone"
  ON analytics_events FOR INSERT
  WITH CHECK (true);