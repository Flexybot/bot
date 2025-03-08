"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// Define strict types for our data structures
type Organization = {
  id: string;
  name: string;
  slug?: string;
  created_at?: string;
  updated_at?: string;
  plan_id?: string;
  role?: string;
};

type OrganizationMember = {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
  updated_at: string;
};

type Subscription = {
  id: string;
  organization_id: string;
  plan_id: string;
  status: 'active' | 'trialing' | 'canceled' | 'incomplete' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
};

export function useOrganization() {
  const { user, isLoading: authLoading } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch organizations using direct query to avoid RLS recursion
  const fetchOrganizations = async () => {
    if (!user?.id) return [];
    
    try {
      // Use the RPC function we created
      const { data, error } = await supabase.rpc(
        'get_user_organizations',
        { user_uuid: user.id }
      );
      
      if (error) throw error;
      
      // Process the JSON data returned from the function
      return data || [];
    } catch (error: any) {
      console.error("Error fetching organizations:", error);
      setError(error.message);
      return [];
    }
  };

  // Load user's organizations
  useEffect(() => {
    let mounted = true;
    
    const loadOrganizations = async () => {
      // Don't fetch if auth is still loading or no user
      if (authLoading || !user) {
        setIsLoading(false);
        return;
      }

      try {
        setError(null);
        setIsLoading(true);

        const orgs = await fetchOrganizations();

        if (!mounted) return;

        setOrganizations(orgs);

        // Set current organization to the first one if none selected
        if (!currentOrganization && orgs.length > 0) {
          setCurrentOrganization(orgs[0]);
        }
      } catch (err: any) {
        console.error('Error loading organizations:', err);
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadOrganizations();

    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

  // Load organization details when current organization changes
  useEffect(() => {
    let mounted = true;
    
    const loadOrgDetails = async () => {
      if (!currentOrganization?.id) return;

      try {
        // Load members and subscription in parallel
        const [membersResponse, subscriptionResponse] = await Promise.all([
          supabase.rpc('get_organization_members', {
            org_id: currentOrganization.id
          }),
          supabase.rpc('get_organization_subscription', {
            org_id: currentOrganization.id
          })
        ]);

        if (!mounted) return;

        if (membersResponse.error) throw membersResponse.error;
        setMembers(membersResponse.data || []);

        if (subscriptionResponse.error && subscriptionResponse.error.code !== 'PGRST116') {
          throw subscriptionResponse.error;
        }
        setSubscription(subscriptionResponse.data);
      } catch (err: any) {
        console.error('Error loading organization details:', err);
        if (mounted) {
          setError(err.message);
        }
      }
    };

    loadOrgDetails();

    return () => {
      mounted = false;
    };
  }, [currentOrganization?.id]);

  const switchOrganization = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setCurrentOrganization(org);
    }
  };

  const createOrganization = async (name: string, planId: string | null = null) => {
    if (!user?.id) {
      throw new Error("User not authenticated");
    }
    
    try {
      setError(null);
      
      // Use the RPC function to create organization safely
      const { data, error } = await supabase.rpc(
        'create_organization_with_admin',
        { 
          org_name: name,
          admin_user_id: user.id,
          plan_id: planId
        }
      );
      
      if (error) throw error;
      
      // Refresh the organizations list
      const updatedOrgs = await fetchOrganizations();
      setOrganizations(updatedOrgs);
      
      const newOrg = {
        ...data,
        role: 'admin'
      };
      
      // Set as current if it's the only organization
      if (updatedOrgs.length === 1) {
        setCurrentOrganization(newOrg);
      }
      
      return { organization: newOrg, error: null };
    } catch (error: any) {
      console.error("Error creating organization:", error);
      setError(error.message);
      return { organization: null, error: error.message };
    }
  };

  const inviteMember = async (email: string, role: 'admin' | 'member' = 'member') => {
    if (!currentOrganization) {
      return { error: 'No organization selected' };
    }

    try {
      setError(null);
      
      const { data, error } = await supabase.rpc(
        'invite_organization_member',
        {
          org_id: currentOrganization.id,
          member_email: email,
          member_role: role
        }
      );

      if (error) throw error;

      // Refresh members list
      const { data: updatedMembers, error: refreshError } = await supabase.rpc(
        'get_organization_members',
        { org_id: currentOrganization.id }
      );

      if (refreshError) throw refreshError;
      setMembers(updatedMembers);

      return { 
        success: true, 
        error: null,
        message: `Successfully added ${email} to the organization`
      };
    } catch (err: any) {
      console.error('Error inviting member:', err);
      setError(err.message);
      return { 
        success: false, 
        error: err.message,
        message: null
      };
    }
  };

  return {
    organizations,
    currentOrganization,
    members,
    subscription,
    isLoading,
    error,
    switchOrganization,
    createOrganization,
    inviteMember
  };
}