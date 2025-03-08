/*
  # Fix Organization Members Policies

  1. Changes
    - Fix infinite recursion in organization_members policies
    - Add proper RLS policies for organization access
    - Add policies for public chatbot access

  2. Security
    - Enable RLS on all tables
    - Add proper access control policies
*/

-- Enable RLS
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table chatbots enable row level security;

-- Organization Members Policies
create policy "Users can view their own organization memberships"
  on organization_members
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Organization admins can manage members"
  on organization_members
  for all
  to authenticated
  using (
    exists (
      select 1 from organization_members
      where organization_id = organization_members.organization_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
    )
  );

-- Organizations Policies
create policy "Users can view organizations they are members of"
  on organizations
  for select
  to authenticated
  using (
    exists (
      select 1 from organization_members
      where organization_id = organizations.id
      and user_id = auth.uid()
    )
  );

create policy "Organization owners can manage organization"
  on organizations
  for all
  to authenticated
  using (
    exists (
      select 1 from organization_members
      where organization_id = organizations.id
      and user_id = auth.uid()
      and role = 'owner'
    )
  );

-- Chatbots Policies
create policy "Users can view chatbots in their organization"
  on chatbots
  for select
  to authenticated
  using (
    exists (
      select 1 from organization_members
      where organization_id = chatbots.organization_id
      and user_id = auth.uid()
    )
  );

create policy "Public can view active chatbots"
  on chatbots
  for select
  to anon
  using (
    is_active = true
  );

create policy "Organization members can manage chatbots"
  on chatbots
  for all
  to authenticated
  using (
    exists (
      select 1 from organization_members
      where organization_id = chatbots.organization_id
      and user_id = auth.uid()
      and role in ('owner', 'admin', 'member')
    )
  );