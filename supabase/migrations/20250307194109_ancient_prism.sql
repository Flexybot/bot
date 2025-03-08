/*
  # Database Helper Functions
  
  1. Functions
    - get_user_organizations: Get organizations for a user with roles
    - get_organization_members: Get members of an organization
    - get_organization_subscription: Get subscription details
    - create_organization_with_admin: Create org and add admin member
    - invite_organization_member: Add a new member to an organization

  2. Security
    - Functions are executed with invoker rights
    - Access control through RLS policies
*/

-- Function to get user's organizations with roles
CREATE OR REPLACE FUNCTION get_user_organizations(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  role text,
  created_at timestamptz,
  updated_at timestamptz
) 
SECURITY INVOKER
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.slug,
    om.role,
    o.created_at,
    o.updated_at
  FROM organizations o
  JOIN organization_members om ON o.id = om.organization_id
  WHERE om.user_id = user_uuid;
END;
$$;

-- Function to get organization members
CREATE OR REPLACE FUNCTION get_organization_members(org_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  role text,
  created_at timestamptz
)
SECURITY INVOKER
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    om.id,
    om.user_id,
    au.email,
    om.role,
    om.created_at
  FROM organization_members om
  JOIN auth.users au ON om.user_id = au.id
  WHERE om.organization_id = org_id;
END;
$$;

-- Function to get organization subscription
CREATE OR REPLACE FUNCTION get_organization_subscription(org_id uuid)
RETURNS TABLE (
  id uuid,
  plan_id text,
  status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean,
  stripe_customer_id text,
  stripe_subscription_id text
)
SECURITY INVOKER
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.plan_id,
    s.status,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at_period_end,
    s.stripe_customer_id,
    s.stripe_subscription_id
  FROM subscriptions s
  WHERE s.organization_id = org_id;
END;
$$;

-- Function to create organization and add admin
CREATE OR REPLACE FUNCTION create_organization_with_admin(
  org_name text,
  admin_user_id uuid,
  plan_id text DEFAULT NULL
)
RETURNS organizations
SECURITY INVOKER
LANGUAGE plpgsql AS $$
DECLARE
  new_org organizations;
BEGIN
  -- Create organization
  INSERT INTO organizations (name, slug, created_at, updated_at)
  VALUES (
    org_name,
    lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g')),
    now(),
    now()
  )
  RETURNING * INTO new_org;

  -- Add admin member
  INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    created_at,
    updated_at
  )
  VALUES (
    new_org.id,
    admin_user_id,
    'admin',
    now(),
    now()
  );

  -- Create free subscription if no plan specified
  IF plan_id IS NULL THEN
    INSERT INTO subscriptions (
      organization_id,
      plan_id,
      status,
      current_period_start,
      current_period_end
    )
    VALUES (
      new_org.id,
      'FREE',
      'active',
      now(),
      now() + interval '100 years'
    );
  END IF;

  RETURN new_org;
END;
$$;

-- Function to invite organization member
CREATE OR REPLACE FUNCTION invite_organization_member(
  org_id uuid,
  member_email text,
  member_role text DEFAULT 'member'
)
RETURNS organization_members
SECURITY INVOKER
LANGUAGE plpgsql AS $$
DECLARE
  user_id uuid;
  new_member organization_members;
BEGIN
  -- Get user ID from email
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = member_email;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Add member
  INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    created_at,
    updated_at
  )
  VALUES (
    org_id,
    user_id,
    member_role,
    now(),
    now()
  )
  RETURNING * INTO new_member;

  RETURN new_member;
END;
$$;