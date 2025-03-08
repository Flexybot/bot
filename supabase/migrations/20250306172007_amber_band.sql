/*
  # Add Performance Optimization Indexes

  1. New Indexes
    - Organizations:
      - `slug` for quick organization lookups
    
    - Organization Members:
      - `user_id` for user-based queries
      - `organization_id` for org-based filtering
      - `role` for role-based access control
    
    - Chatbots:
      - `organization_id` for org-based filtering
      - `is_active` for active chatbot queries
    
    - Subscriptions:
      - `organization_id` for org-based filtering
      - `status` for subscription status queries
      - `current_period_end` for expiration checks
    
    - API Keys:
      - `organization_id` for org-based filtering
      - `expires_at` for expiration checks
    
    - Statistics:
      - `organization_id` for org-based filtering
      - `chatbot_id` for chatbot-specific stats
      - `date` for time-based queries

  2. Benefits
    - Improved query performance for common operations
    - Better filtering and sorting efficiency
    - Optimized joins between related tables
    - Enhanced search capabilities
*/

-- Indexes for organizations
CREATE INDEX IF NOT EXISTS idx_organizations_slug 
    ON public.organizations(slug);

-- Indexes for organization members
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id 
    ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id 
    ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_role 
    ON public.organization_members(role);

-- Indexes for chatbots
CREATE INDEX IF NOT EXISTS idx_chatbots_org_id 
    ON public.chatbots(organization_id);
CREATE INDEX IF NOT EXISTS idx_chatbots_is_active 
    ON public.chatbots(is_active);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id 
    ON public.subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
    ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end 
    ON public.subscriptions(current_period_end);

-- Indexes for API keys
CREATE INDEX IF NOT EXISTS idx_api_keys_org_id 
    ON public.api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at 
    ON public.api_keys(expires_at);

-- Indexes for statistics
CREATE INDEX IF NOT EXISTS idx_statistics_org_id 
    ON public.statistics(organization_id);
CREATE INDEX IF NOT EXISTS idx_statistics_chatbot_id 
    ON public.statistics(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_statistics_date 
    ON public.statistics(date);