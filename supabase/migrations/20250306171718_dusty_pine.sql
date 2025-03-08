/*
  # Add Updated At Triggers

  1. New Functions
    - `handle_updated_at()`: Updates the updated_at timestamp automatically

  2. New Triggers
    - Add updated_at triggers for:
      - organizations
      - organization_members
      - subscription_plans
      - subscriptions
      - chatbots
      - api_keys
      - statistics
      - file_uploads

  3. Changes
    - Ensures all tables maintain accurate updated_at timestamps
    - Triggers fire automatically before any update
*/

-- Create the handle_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
DO $$ 
BEGIN
    -- Organizations
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'handle_organizations_updated_at'
    ) THEN
        CREATE TRIGGER handle_organizations_updated_at
            BEFORE UPDATE ON public.organizations
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    -- Organization Members
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'handle_organization_members_updated_at'
    ) THEN
        CREATE TRIGGER handle_organization_members_updated_at
            BEFORE UPDATE ON public.organization_members
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    -- Subscription Plans
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'handle_subscription_plans_updated_at'
    ) THEN
        CREATE TRIGGER handle_subscription_plans_updated_at
            BEFORE UPDATE ON public.subscription_plans
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    -- Subscriptions
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'handle_subscriptions_updated_at'
    ) THEN
        CREATE TRIGGER handle_subscriptions_updated_at
            BEFORE UPDATE ON public.subscriptions
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    -- Chatbots
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'handle_chatbots_updated_at'
    ) THEN
        CREATE TRIGGER handle_chatbots_updated_at
            BEFORE UPDATE ON public.chatbots
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    -- API Keys
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'handle_api_keys_updated_at'
    ) THEN
        CREATE TRIGGER handle_api_keys_updated_at
            BEFORE UPDATE ON public.api_keys
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    -- Statistics
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'handle_statistics_updated_at'
    ) THEN
        CREATE TRIGGER handle_statistics_updated_at
            BEFORE UPDATE ON public.statistics
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    -- File Uploads
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'handle_file_uploads_updated_at'
    ) THEN
        CREATE TRIGGER handle_file_uploads_updated_at
            BEFORE UPDATE ON public.file_uploads
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;