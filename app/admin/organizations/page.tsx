"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/dashboard/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { 
  Eye, 
  MoreHorizontal,
  ExternalLink,
  Check,
  Ban,
  Trash2
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

// Sample Organizations data
type Organization = {
  id: string;
  name: string;
  slug: string;
  planName: string;
  status: string;
  usersCount: number;
  chatbotsCount: number;
  created: string;
};

const organizations: Organization[] = [
  {
    id: '1',
    name: 'Acme Inc.',
    slug: 'acme-inc',
    planName: 'Premium',
    status: 'active',
    usersCount: 8,
    chatbotsCount: 6,
    created: '10 Oct, 2023',
  },
  {
    id: '2',
    name: 'Startup Co',
    slug: 'startup-co',
    planName: 'Basic',
    status: 'active',
    usersCount: 3,
    chatbotsCount: 2,
    created: '15 Oct, 2023',
  },
  {
    id: '3',
    name: 'Tech Solutions',
    slug: 'tech-solutions',
    planName: 'Free',
    status: 'trial',
    usersCount: 1,
    chatbotsCount: 1,
    created: '20 Oct, 2023',
  },
  {
    id: '4',
    name: 'Global Services',
    slug: 'global-services',
    planName: 'Premium',
    status: 'past_due',
    usersCount: 5,
    chatbotsCount: 4,
    created: '25 Oct, 2023',
  },
  {
    id: '5',
    name: 'Local Business',
    slug: 'local-business',
    planName: 'Basic',
    status: 'active',
    usersCount: 2,
    chatbotsCount: 3,
    created: '01 Nov, 2023',
  },
];

export default function OrganizationsPage() {
  const columns: ColumnDef<Organization>[] = [
    {
      accessorKey: 'name',
      header: 'Organization Name',
      cell: ({ row }) => {
        const name = row.getValue('name') as string;
        const slug = row.original.slug;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{name}</span>
            <span className="text-xs text-muted-foreground">{slug}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'planName',
      header: 'Plan',
      cell: ({ row }) => {
        const plan = row.getValue('planName') as string;
        return (
          <Badge variant={plan === 'Premium' ? 'default' : plan === 'Basic' ? 'outline' : 'secondary'}>
            {plan}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        let badgeClass = '';
        let label = '';
        
        switch(status) {
          case 'active':
            badgeClass = 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            label = 'Active';
            break;
          case 'trial':
            badgeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
            label = 'Trial';
            break;
          case 'past_due':
            badgeClass = 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            label = 'Past Due';
            break;
          default:
            badgeClass = 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
            label = status;
        }
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
            {label}
          </span>
        );
      },
    },
    {
      accessorKey: 'usersCount',
      header: 'Users',
    },
    {
      accessorKey: 'chatbotsCount',
      header: 'Chatbots',
    },
    {
      accessorKey: 'created',
      header: 'Created',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const organization = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                <span>View Details</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ExternalLink className="mr-2 h-4 w-4" />
                <span>View Chatbots</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {organization.status === 'active' ? (
                <DropdownMenuItem className="text-amber-600 dark:text-amber-400">
                  <Ban className="mr-2 h-4 w-4" />
                  <span>Suspend</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="text-green-600 dark:text-green-400">
                  <Check className="mr-2 h-4 w-4" />
                  <span>Activate</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-red-600 dark:text-red-400">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Organizations</h2>
        <Button>Add Organization</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Organizations</CardTitle>
          <CardDescription>
            Manage all organizations on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={organizations} 
            searchColumn="name"
          />
        </CardContent>
      </Card>
    </div>
  );
}