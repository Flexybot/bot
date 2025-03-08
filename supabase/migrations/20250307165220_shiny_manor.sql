/*
  # Update Daily Statistics Function

  1. Changes
    - Drop existing function if exists
    - Create new update_daily_statistics function
    - Add pg_cron extension
    - Schedule daily statistics update

  2. Security
    - Function runs with security definer
    - Access controlled through RLS policies
*/

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_daily_statistics();

-- Create new function with updated logic
CREATE OR REPLACE FUNCTION update_daily_statistics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    yesterday DATE := current_date - interval '1 day';
    org_id_var UUID;
    chatbot_id_var UUID;
BEGIN
    -- Loop through each organization and chatbot combination
    FOR org_id_var, chatbot_id_var IN
        SELECT DISTINCT c.organization_id, c.chatbot_id
        FROM chats c
        WHERE c.chatbot_id IS NOT NULL
        AND c.created_at::date = yesterday
    LOOP
        -- Insert or update statistics
        INSERT INTO statistics (
            organization_id,
            chatbot_id,
            date,
            total_messages,
            total_sessions,
            total_users,
            avg_response_time,
            created_at,
            updated_at
        )
        SELECT
            org_id_var,
            chatbot_id_var,
            yesterday,
            COUNT(m.id),
            COUNT(DISTINCT m.chat_id),
            COUNT(DISTINCT c.user_id),
            AVG(
                CASE 
                    WHEN m.role = 'assistant' 
                    AND m.id > lag(m.id) OVER (PARTITION BY m.chat_id ORDER BY m.created_at) 
                    THEN 
                        EXTRACT(EPOCH FROM (m.created_at - lag(m.created_at) OVER (PARTITION BY m.chat_id ORDER BY m.created_at))) * 1000
                    ELSE NULL
                END
            ),
            now(),
            now()
        FROM
            messages m
            JOIN chats c ON m.chat_id = c.id
        WHERE
            c.organization_id = org_id_var
            AND c.chatbot_id = chatbot_id_var
            AND m.created_at::date = yesterday
        ON CONFLICT (organization_id, chatbot_id, date) 
        DO UPDATE SET
            total_messages = EXCLUDED.total_messages,
            total_sessions = EXCLUDED.total_sessions,
            total_users = EXCLUDED.total_users,
            avg_response_time = EXCLUDED.avg_response_time,
            updated_at = now();
    END LOOP;
END;
$$;

-- Revoke public access and grant to authenticated users
REVOKE ALL ON FUNCTION update_daily_statistics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_daily_statistics() TO authenticated;

-- Schedule the function to run daily at 1 AM UTC
SELECT cron.schedule(
    'update-daily-stats',  -- unique job name
    '0 1 * * *',          -- cron schedule (1 AM UTC daily)
    'SELECT update_daily_statistics()'
);

-- Add comment to function
COMMENT ON FUNCTION update_daily_statistics() IS 'Updates daily statistics for all organizations and chatbots from the previous day. Runs automatically at 1 AM UTC.';