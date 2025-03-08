"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/dashboard/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { 
  Eye, 
  MoreHorizontal,
  ExternalLink,
  LogIn,
  Lock,
  Unlock,
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

// Sample Users data
type User = {
  id: string;
  email: string;
  name: string;
  organizationName: string;
  role: string;
  status: string;
  lastActive: string;
  created: string;
};

const users: User[] = [
  {
    id: '1',
    email: 'john@acme.com',
    name: 'John Smith',
    organizationName: 'Acme Inc.',
    role: 'Owner',
    status: 'active',
    lastActive: '10 Nov, 2023',
    created: '10 Oct, 2023',
  },
  {
    id: '2',
    email: 'jane@startup.co',
    name: 'Jane Doe',
    organizationName: 'Startup Co',
    role: 'Owner',
    status: 'active',
    lastActive: '09 Nov, 2023',
    created: '15 Oct, 2023',
  },
  {
    id: '3',
    email: 'bob@tech.com',
    name: 'Bob Johnson',
    organizationName: 'Tech Solutions',
    role: 'Owner',
    status: 'inactive',
    lastActive: '01 Nov, 2023',
    created: '20 Oct, 2023',
  },
  {
    id: '4',
    email: 'sarah@global.com',
    name: 'Sarah Williams',
    organizationName: 'Global Services',
    role: 'Admin',
    status: 'active',
    lastActive: '08 Nov, 2023',
    created: '25 Oct, 2023',
  },
  {
    id: '5',
    email: 'mike@local.com',
    name: 'Mike Brown',
    organizationName: 'Local Business',
    role: 'Member',
    status: 'active',
    lastActive: '07 Nov, 2023',
    created: '01 Nov, 2023',
  },
];

export default function UsersPage() {
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => {
        const email = row.getValue('email') as string;
        const name = row.original.name;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{email}</span>
            <span className="text-xs text-muted-foreground">{name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'organizationName',
      header: 'Organization',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.getValue('role') as string;
        let variant: 'default' | 'outline' | 'secondary' = 'outline';
        
        if (role === 'Owner') variant = 'default';
        else if (role === 'Admin') variant = 'secondary';
        
        return <Badge variant={variant}>{role}</Badge>;
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
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {status === 'active' ? 'Active' : 'Inactive'}
          </span>
        );
      },
    },
    {
      accessorKey: 'lastActive',
      header: 'Last Active',
    },
    {
      accessorKey: 'created',
      header: 'Created',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        
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
                <span>View Organization</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogIn className="mr-2 h-4 w-4" />
                <span>Impersonate</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user.status === 'active' ? (
                <DropdownMenuItem className="text-amber-600 dark:text-amber-400">
                  <Lock className="mr-2 h-4 w-4" />
                  <span>Deactivate</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="text-green-600 dark:text-green-400">
                  <Unlock className="mr-2 h-4 w-4" />
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
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
        <Button>Invite User</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Manage all users on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={users} 
            searchColumn="email"
          />
        </CardContent>
      </Card>
    </div>
  );
}