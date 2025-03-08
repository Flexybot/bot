/*
  # Insert Default Subscription Plans

  1. Changes
    - Insert three default subscription plans:
      - Free: Basic plan for personal use
      - Basic: Enhanced features for small businesses
      - Premium: Advanced features for growing businesses
    
  2. Details
    - Each plan includes:
      - Name and description
      - Monthly and yearly pricing (in cents)
      - Feature flags as JSONB
      - Resource limits (chatbots, team members, documents, storage)
    
  3. Implementation
    - Uses safe insertion with DO block to prevent duplicates
    - Sets is_active to true by default
    - Includes created_at and updated_at timestamps
*/

DO $$ 
BEGIN
  -- Free Plan
  IF NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Free') THEN
    INSERT INTO public.subscription_plans 
    (name, description, price_monthly, price_yearly, features, max_chatbots, max_team_members, max_documents, max_storage_mb, is_active, created_at, updated_at)
    VALUES
    ('Free', 'Basic chatbot functionality for personal use', 0, 0, 
     '{"custom_domain": false, "file_upload": true, "api_access": false, "priority_support": false}'::jsonb,
     1, 1, 5, 50, true, now(), now());
  END IF;

  -- Basic Plan
  IF NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Basic') THEN
    INSERT INTO public.subscription_plans 
    (name, description, price_monthly, price_yearly, features, max_chatbots, max_team_members, max_documents, max_storage_mb, is_active, created_at, updated_at)
    VALUES
    ('Basic', 'Enhanced features for small businesses', 2900, 29900, 
     '{"custom_domain": true, "file_upload": true, "api_access": true, "priority_support": false}'::jsonb,
     3, 3, 20, 200, true, now(), now());
  END IF;

  -- Premium Plan
  IF NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Premium') THEN
    INSERT INTO public.subscription_plans 
    (name, description, price_monthly, price_yearly, features, max_chatbots, max_team_members, max_documents, max_storage_mb, is_active, created_at, updated_at)
    VALUES
    ('Premium', 'Advanced features for growing businesses', 7900, 79900, 
     '{"custom_domain": true, "file_upload": true, "api_access": true, "priority_support": true}'::jsonb,
     10, 10, 100, 1000, true, now(), now());
  END IF;
END $$;