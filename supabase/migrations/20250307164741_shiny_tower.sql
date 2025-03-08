/*
  # Add Analytics System

  1. New Tables
    - `statistics` - Daily analytics data for chatbots
    - `message_feedback` - User feedback on chatbot responses
    - `invoices` - Payment history and invoice records

  2. Functions
    - `get_chatbot_feedback_stats` - Get feedback statistics by chatbot
    - `get_top_questions` - Get most frequently asked questions
    - `update_message_stats` - Update message statistics

  3. Security
    - RLS policies for analytics data
    - Secure function execution
*/

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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organization_id, chatbot_id, date)
);

-- Create message feedback table
CREATE TABLE IF NOT EXISTS message_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (message_id, user_id)
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  amount_paid BIGINT NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  invoice_pdf TEXT,
  hosted_invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
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
  not_helpful_count BIGINT,
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
      COUNT(mf.id) FILTER (WHERE mf.is_helpful = false) AS not_helpful_count
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
    fd.not_helpful_count,
    CASE
      WHEN fd.total_messages > 0 THEN
        ROUND((fd.helpful_count::NUMERIC / NULLIF(fd.helpful_count + fd.not_helpful_count, 0)::NUMERIC) * 100)::INTEGER
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
      m_user.content AS question,
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
      m_user.content
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
    NEW.organization_id,
    NEW.chatbot_id,
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
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);
CREATE INDEX IF NOT EXISTS idx_feedback_message_helpful ON message_feedback(message_id, is_helpful);
CREATE INDEX IF NOT EXISTS idx_statistics_date_range ON statistics(organization_id, chatbot_id, date);

-- Add RLS policies
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

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

-- Message feedback policies
CREATE POLICY "Users can manage feedback for their organizations"
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

-- Invoice policies
CREATE POLICY "Organization owners can view invoices"
  ON invoices
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Set function permissions
REVOKE ALL ON FUNCTION get_chatbot_feedback_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_top_questions(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID, INTEGER) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION get_chatbot_feedback_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_questions(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID, INTEGER) TO authenticated;