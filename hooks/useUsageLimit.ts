"use client";

import { useState, useEffect } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/lib/supabase';
import { PLAN_LIMITS } from '@/lib/stripe/config';

type ResourceType = 'chatbots' | 'teamMembers' | 'documents' | 'storage' | 'messages';

interface UsageStats {
  chatbots: number;
  teamMembers: number;
  documents: number;
  storage: number;
  messages: number;
}

interface UsageLimits {
  chatbots: number;
  teamMembers: number;
  documents: number;
  storage: number;
  messages: number;
}

export function useUsageLimit() {
  const { subscription, currentOrganization } = useOrganization();
  const [usage, setUsage] = useState<UsageStats>({
    chatbots: 0,
    teamMembers: 0,
    documents: 0,
    storage: 0,
    messages: 0
  });
  const [limits, setLimits] = useState<UsageLimits>({
    chatbots: PLAN_LIMITS.FREE.chatbots,
    teamMembers: PLAN_LIMITS.FREE.teamMembers,
    documents: PLAN_LIMITS.FREE.documents,
    storage: PLAN_LIMITS.FREE.storage,
    messages: PLAN_LIMITS.FREE.messagesPerMonth
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch usage data
  useEffect(() => {
    async function fetchUsage() {
      if (!currentOrganization?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        // Set limits based on subscription plan
        const planId = subscription?.plan_id || 'FREE';
        const planLimits = PLAN_LIMITS[planId as keyof typeof PLAN_LIMITS];
        
        if (planLimits) {
          setLimits({
            chatbots: planLimits.chatbots,
            teamMembers: planLimits.teamMembers,
            documents: planLimits.documents,
            storage: planLimits.storage,
            messages: planLimits.messagesPerMonth
          });
        }

        // Fetch all usage data in parallel
        const [
          { count: chatbotsCount },
          { count: teamMembersCount },
          { count: documentsCount },
          { data: storageData },
          { count: messagesCount }
        ] = await Promise.all([
          // Count chatbots
          supabase
            .from('chatbots')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', currentOrganization.id),

          // Count team members
          supabase
            .from('organization_members')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', currentOrganization.id),

          // Count documents
          supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', currentOrganization.id),

          // Get storage usage
          supabase
            .from('documents')
            .select('size_bytes')
            .eq('organization_id', currentOrganization.id),

          // Count messages for current month
          supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', currentOrganization.id)
            .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        ]);

        // Calculate total storage in MB
        const totalStorageInBytes = storageData?.reduce((total, doc) => total + (doc.size_bytes || 0), 0) || 0;
        const totalStorageInMB = Math.ceil(totalStorageInBytes / (1024 * 1024));

        setUsage({
          chatbots: chatbotsCount || 0,
          teamMembers: teamMembersCount || 0,
          documents: documentsCount || 0,
          storage: totalStorageInMB,
          messages: messagesCount || 0
        });

      } catch (err: any) {
        console.error('Error fetching usage data:', err);
        setError(err.message || 'Failed to fetch usage data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsage();
  }, [currentOrganization?.id, subscription?.plan_id]);

  // Check if a resource is over its limit
  const isOverLimit = (resource: ResourceType): boolean => {
    return usage[resource] >= limits[resource];
  };

  // Get percentage of usage for a resource
  const getUsagePercentage = (resource: ResourceType): number => {
    if (limits[resource] === 0) return 100;
    return Math.min(Math.round((usage[resource] / limits[resource]) * 100), 100);
  };

  // Get remaining quota for a resource
  const getRemaining = (resource: ResourceType): number => {
    return Math.max(0, limits[resource] - usage[resource]);
  };

  // Check if user can create more of a resource
  const canCreate = (resource: ResourceType): boolean => {
    return usage[resource] < limits[resource];
  };

  // Get friendly status for a resource
  const getResourceStatus = (resource: ResourceType): 'normal' | 'warning' | 'critical' => {
    const percentage = getUsagePercentage(resource);
    if (percentage >= 90) return 'critical';
    if (percentage >= 75) return 'warning';
    return 'normal';
  };

  return {
    usage,
    limits,
    isLoading,
    error,
    isOverLimit,
    getUsagePercentage,
    getRemaining,
    canCreate,
    getResourceStatus
  };
}