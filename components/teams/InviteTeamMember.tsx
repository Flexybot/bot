"use client";

import { useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardTitle, CardDescription, CardHeader, CardContent, CardFooter, Card } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExclamationTriangleIcon, CheckCircledIcon } from '@radix-ui/react-icons';
import Link from 'next/link';

export default function InviteTeamMember() {
  const { inviteMember, currentOrganization, subscription } = useOrganization();
  
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!email) {
      setError('Please enter an email address');
      return;
    }
    
    if (!currentOrganization) {
      setError('No organization selected');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error: inviteError, success: inviteSuccess, message } = await inviteMember(email, role);
      
      if (inviteError) {
        setError(inviteError);
        return;
      }
      
      setEmail('');
      setSuccess(message || 'Invitation sent successfully!');
      
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate if team member limit is reached
  const teamLimit = subscription?.plan?.max_team_members || 1;
  const currentMembers = 0; // This should be calculated from the members list
  const isLimitReached = currentMembers >= teamLimit;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Team Member</CardTitle>
        <CardDescription>
          Add members to your organization to collaborate on chatbots.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
              <CheckCircledIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          {isLimitReached && (
            <Alert variant="default" className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-900">
              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle>Team limit reached</AlertTitle>
              <AlertDescription>
                You&apos;ve reached the limit of {teamLimit} team members for your current plan.{' '}
                <Link href="/settings/billing" className="font-medium underline hover:no-underline">
                  Upgrade your plan
                </Link>{' '}
                to add more members.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || isLimitReached}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as 'admin' | 'member')}
              disabled={isLoading || isLimitReached}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Admins can manage team members and billing. Members can only create and manage chatbots.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            disabled={isLoading || isLimitReached} 
            className="w-full"
          >
            {isLoading ? 'Sending invitation...' : 'Send Invitation'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}