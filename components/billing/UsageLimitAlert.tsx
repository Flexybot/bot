"use client";

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useUsageLimit } from '@/hooks/useUsageLimit';
import { useOrganization } from '@/hooks/useOrganization';
import Link from 'next/link';

interface UsageLimitAlertProps {
  resourceType: 'chatbots' | 'teamMembers' | 'documents' | 'storage' | 'messages';
  action: string;
}

export function UsageLimitAlert({ resourceType, action }: UsageLimitAlertProps) {
  const { isOverLimit, limits, usage, getUsagePercentage, getResourceStatus } = useUsageLimit();
  const { subscription } = useOrganization();
  
  // Map resource types to human-readable names
  const resourceNames = {
    chatbots: 'chatbots',
    teamMembers: 'team members',
    documents: 'documents',
    storage: 'MB of storage',
    messages: 'messages per month'
  };

  // Don't show alert if not over limit
  if (!isOverLimit(resourceType)) {
    return null;
  }

  // Get status to determine alert styling
  const status = getResourceStatus(resourceType);
  const percentage = getUsagePercentage(resourceType);
  const isFreePlan = !subscription?.plan_id || subscription.plan_id === 'FREE';

  return (
    <Alert 
      variant={status === 'critical' ? 'destructive' : 'warning'} 
      className="mb-4"
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {status === 'critical' ? 'Usage limit reached' : 'Usage limit approaching'}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <div className="text-sm">
          {status === 'critical' ? (
            <p>
              You've reached your plan limit of {limits[resourceType]} {resourceNames[resourceType]}.
              To {action}, please upgrade your plan.
            </p>
          ) : (
            <p>
              You're using {percentage}% of your {resourceNames[resourceType]} limit 
              ({usage[resourceType]} of {limits[resourceType]}).
              Consider upgrading your plan to avoid interruption.
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Link href="/dashboard/billing">
            <Button size="sm" variant={status === 'critical' ? 'default' : 'outline'}>
              {isFreePlan ? 'Upgrade to Pro' : 'View Plans'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          {status !== 'critical' && (
            <Link href="/docs/usage-limits" className="text-sm text-muted-foreground hover:underline">
              Learn more
            </Link>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}