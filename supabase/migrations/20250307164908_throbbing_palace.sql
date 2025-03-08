/*
  # Add Analytics System Tables and Functions

  1. New Tables
    - `chats` - Chat sessions between users and chatbots
    - `messages` - Individual messages within chat sessions
    - `message_feedback` - User feedback on chatbot responses
    - `statistics` - Daily analytics data for chatbots

  2. Functions
    - `get_chatbot_feedback_stats` - Get feedback statistics by chatbot
    - `get_top_questions` - Get most frequently asked questions
    - `update_message_stats` - Update message statistics

  3. Security
    - RLS policies for all tables
    - Secure function execution
*/

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  chatbot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content JSONB NOT NULL,
  tokens INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create message feedback table
CREATE TABLE IF NOT EXISTS message_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (message_id, user_id)
);

-- Create statistics table
CREATE TABLE IF NOT EXISTS statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  chatbot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_messages BIGINT DEFAULT 0,
  total_sessions BIGINT DEFAULT 0,
  total_users BIGINT DEFAULT 0,
  avg_response_time NUMERIC DEFAULT 0,
  helpful_responses BIGINT DEFAULT 0,
  unhelpful_responses BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organization_id, chatbot_id, date)
);

-- Create function to get feedback statistics
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

-- Create function to get top questions
CREATE OR REPLACE FUNCTION get_top_questions(
  org_id UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  bot_id UUID DEFAULT NULL,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  question TEXT,
  count BIGINT,
  last_asked TIMESTAMPTZ,
  avg_response_time NUMERIC,
  helpful_percentage INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH question_stats AS (
    SELECT
      m_user.content->>'text' AS question,
      COUNT(*) AS question_count,
      MAX(m_user.created_at) AS last_asked,
      AVG(EXTRACT(EPOCH FROM (m_assistant.created_at - m_user.created_at))) AS avg_response_time,
      COUNT(mf.id) FILTER (WHERE mf.is_helpful = true)::NUMERIC / NULLIF(COUNT(mf.id), 0)::NUMERIC * 100 AS helpful_percent
    FROM
      messages m_user
      JOIN chats c ON m_user.chat_id = c.id
      JOIN messages m_assistant ON m_user.chat_id = m_assistant.chat_id
        AND m_assistant.created_at > m_user.created_at
        AND m_assistant.role = 'assistant'
      LEFT JOIN message_feedback mf ON m_assistant.id = mf.message_id
    WHERE
      c.organization_id = org_id
      AND (bot_id IS NULL OR c.chatbot_id = bot_id)
      AND m_user.created_at >= start_date
      AND m_user.created_at <= end_date
      AND m_user.role = 'user'
    GROUP BY
      m_user.content->>'text'
    HAVING
      COUNT(*) >= 2  -- Only show questions asked multiple times
  )
  SELECT
    qs.question,
    qs.question_count AS count,
    qs.last_asked,
    ROUND(qs.avg_response_time::NUMERIC, 2) AS avg_response_time,
    ROUND(qs.helpful_percent)::INTEGER AS helpful_percentage
  FROM
    question_stats qs
  ORDER BY
    qs.question_count DESC,
    qs.last_asked DESC
  LIMIT limit_count;
END;
$$;

-- Create function to update message statistics
CREATE OR REPLACE FUNCTION update_message_stats()
RETURNS TRIGGER
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
    total_users,
    avg_response_time
  )
  VALUES (
    (SELECT organization_id FROM chats WHERE id = NEW.chat_id),
    (SELECT chatbot_id FROM chats WHERE id = NEW.chat_id),
    DATE(NEW.created_at),
    1,
    1,
    CASE WHEN NEW.role = 'user' THEN 1 ELSE 0 END,
    CASE 
      WHEN NEW.role = 'assistant' THEN
        EXTRACT(EPOCH FROM (NEW.created_at - (
          SELECT created_at 
          FROM messages 
          WHERE chat_id = NEW.chat_id 
            AND role = 'user' 
            AND created_at < NEW.created_at
          ORDER BY created_at DESC 
          LIMIT 1
        )))
      ELSE 0
    END
  )
  ON CONFLICT (organization_id, chatbot_id, date)
  DO UPDATE SET
    total_messages = statistics.total_messages + 1,
    total_users = CASE 
      WHEN NEW.role = 'user' THEN statistics.total_users + 1
      ELSE statistics.total_users
    END,
    avg_response_time = CASE
      WHEN NEW.role = 'assistant' THEN
        (statistics.avg_response_time * statistics.total_messages + 
         EXTRACT(EPOCH FROM (NEW.created_at - (
           SELECT created_at 
           FROM messages 
           WHERE chat_id = NEW.chat_id 
             AND role = 'user' 
             AND created_at < NEW.created_at
           ORDER BY created_at DESC 
           LIMIT 1
         )))) / (statistics.total_messages + 1)
      ELSE statistics.avg_response_time
    END,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Create trigger for message statistics
CREATE TRIGGER update_message_stats_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_stats();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_chat_role ON messages(chat_id, role);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_message ON message_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_statistics_date ON statistics(organization_id, chatbot_id, date);

-- Add RLS policies
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;

-- Chats policies
CREATE POLICY "Users can view chats in their organizations"
  ON chats
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chats in their organizations"
  ON chats
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Messages policies
CREATE POLICY "Users can view messages in their organizations' chats"
  ON messages
  FOR SELECT
  USING (
    chat_id IN (
      SELECT c.id 
      FROM chats c
      JOIN organization_members om ON c.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their organizations' chats"
  ON messages
  FOR INSERT
  WITH CHECK (
    chat_id IN (
      SELECT c.id 
      FROM chats c
      JOIN organization_members om ON c.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Message feedback policies
CREATE POLICY "Users can manage feedback in their organizations"
  ON message_feedback
  FOR ALL
  USING (
    chat_id IN (
      SELECT c.id 
      FROM chats c
      JOIN organization_members om ON c.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Statistics policies
CREATE POLICY "Users can view statistics for their organizations"
  ON statistics
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Set function permissions
REVOKE ALL ON FUNCTION get_chatbot_feedback_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_top_questions(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID, INTEGER) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION get_chatbot_feedback_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_questions(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID, INTEGER) TO authenticated;