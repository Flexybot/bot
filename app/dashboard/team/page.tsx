"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/dashboard/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { 
  MoreVertical, 
  Shield, 
  UserPlus,
  Crown,
  UserCog,
  User,
  Trash2,
  Mail
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useOrganization } from '@/hooks/useOrganization';
import { UsageLimitAlert } from '@/components/billing/UsageLimitAlert';
import InviteTeamMember from '@/components/teams/InviteTeamMember';

type TeamMember = {
  id: string;
  email: string;
  name: string | null;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending';
  joinedAt: string;
  lastActive: string | null;
};

export default function TeamPage() {
  const { currentOrganization, members } = useOrganization();
  const [showInviteModal, setShowInviteModal] = useState(false);

  const columns: ColumnDef<TeamMember>[] = [
    {
      accessorKey: 'email',
      header: 'User',
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
              {member.role === 'owner' ? (
                <Crown className="h-4 w-4 text-primary" />
              ) : member.role === 'admin' ? (
                <Shield className="h-4 w-4 text-primary" />
              ) : (
                <User className="h-4 w-4 text-primary" />
              )}
            </div>
            <div>
              <div className="font-medium">{member.email}</div>
              {member.name && (
                <div className="text-sm text-muted-foreground">{member.name}</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.getValue('role') as string;
        return (
          <Badge variant={role === 'owner' ? 'default' : role === 'admin' ? 'secondary' : 'outline'}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            status === 'active' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
          }`}>
            {status === 'active' ? 'Active' : 'Pending'}
          </span>
        );
      },
    },
    {
      accessorKey: 'joinedAt',
      header: 'Joined',
    },
    {
      accessorKey: 'lastActive',
      header: 'Last Active',
      cell: ({ row }) => {
        const lastActive = row.getValue('lastActive');
        return lastActive || 'Never';
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const member = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {member.status === 'pending' ? (
                <DropdownMenuItem>
                  <Mail className="mr-2 h-4 w-4" />
                  <span>Resend Invitation</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem>
                  <UserCog className="mr-2 h-4 w-4" />
                  <span>Edit Role</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 dark:text-red-400">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>{member.status === 'pending' ? 'Cancel Invitation' : 'Remove Member'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Sample team members data
  const teamMembers: TeamMember[] = [
    {
      id: '1',
      email: 'owner@example.com',
      name: 'John Owner',
      role: 'owner',
      status: 'active',
      joinedAt: '2024-01-01',
      lastActive: '2024-03-15 09:30',
    },
    {
      id: '2',
      email: 'admin@example.com',
      name: 'Sarah Admin',
      role: 'admin',
      status: 'active',
      joinedAt: '2024-02-01',
      lastActive: '2024-03-14 15:45',
    },
    {
      id: '3',
      email: 'pending@example.com',
      name: null,
      role: 'member',
      status: 'pending',
      joinedAt: '2024-03-10',
      lastActive: null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Team Members</h2>
          <p className="text-muted-foreground">
            Manage your team and their access levels
          </p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <UsageLimitAlert
        resourceType="teamMembers"
        action="invite more team members"
      />

      {showInviteModal && (
        <InviteTeamMember />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            View and manage your team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={teamMembers}
            searchColumn="email"
          />
        </CardContent>
      </Card>
    </div>
  );
}