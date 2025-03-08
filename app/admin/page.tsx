"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  UsersIcon, 
  BotIcon, 
  FileTextIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  DollarSignIcon
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DataTable } from '@/components/dashboard/DataTable';
import { ColumnDef } from '@tanstack/react-table';

// Sample data for charts
const usageData = [
  { month: 'Jan', conversations: 1200 },
  { month: 'Feb', conversations: 1900 },
  { month: 'Mar', conversations: 3000 },
  { month: 'Apr', conversations: 5000 },
  { month: 'May', conversations: 4780 },
  { month: 'Jun', conversations: 5890 },
  { month: 'Jul', conversations: 6390 },
  { month: 'Aug', conversations: 5900 },
  { month: 'Sep', conversations: 8300 },
  { month: 'Oct', conversations: 7500 },
  { month: 'Nov', conversations: 6500 },
  { month: 'Dec', conversations: 9100 },
];

// Sample recent users
type User = {
  id: string;
  email: string;
  provider: string;
  created: string;
  lastSignIn: string;
  organizationName: string;
};

const recentUsers: User[] = [
  {
    id: 'f3f42fc419-ce32-49fc-92df-28d99c7d123',
    email: 'john@example.com',
    provider: 'Email',
    created: '08 Nov, 2023 15:43',
    lastSignIn: '08 Nov, 2023 15:43',
    organizationName: 'Acme Inc.'
  },
  {
    id: 'f3f42fc419-ce32-49fc-92df-28d99c7d124',
    email: 'sarah@company.io',
    provider: 'Google',
    created: '07 Nov, 2023 10:22',
    lastSignIn: '07 Nov, 2023 10:22',
    organizationName: 'Company.io'
  },
  {
    id: 'f3f42fc419-ce32-49fc-92df-28d99c7d125',
    email: 'alex@techfirm.com',
    provider: 'Email',
    created: '06 Nov, 2023 09:15',
    lastSignIn: '06 Nov, 2023 09:15',
    organizationName: 'TechFirm'
  },
  {
    id: 'f3f42fc419-ce32-49fc-92df-28d99c7d126',
    email: 'megan@startup.net',
    provider: 'Google',
    created: '05 Nov, 2023 14:33',
    lastSignIn: '05 Nov, 2023 14:33',
    organizationName: 'StartUp'
  },
  {
    id: 'f3f42fc419-ce32-49fc-92df-28d99c7d127',
    email: 'david@consultant.org',
    provider: 'Email',
    created: '04 Nov, 2023 16:51',
    lastSignIn: '04 Nov, 2023 16:51',
    organizationName: 'Consultant Group'
  },
];

// Table columns
const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'email',
    header: 'Email Address',
  },
  {
    accessorKey: 'provider',
    header: 'Provider',
  },
  {
    accessorKey: 'organizationName',
    header: 'Organization',
  },
  {
    accessorKey: 'created',
    header: 'Created',
  },
  {
    accessorKey: 'lastSignIn',
    header: 'Last Sign In',
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,842</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpIcon className="mr-1 h-4 w-4 text-green-500" />
              <span className="text-green-500 font-medium">12%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chatbots</CardTitle>
            <BotIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6,218</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpIcon className="mr-1 h-4 w-4 text-green-500" />
              <span className="text-green-500 font-medium">18%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <FileTextIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">149,758</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpIcon className="mr-1 h-4 w-4 text-green-500" />
              <span className="text-green-500 font-medium">24%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$24,491</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowDownIcon className="mr-1 h-4 w-4 text-red-500" />
              <span className="text-red-500 font-medium">3%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Messages usage in the last year</CardTitle>
          <CardDescription>
            Total message interactions across all chatbots
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={usageData}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value.toLocaleString()}`}
                  width={80}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString()} messages`, 'Messages']}
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="conversations"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <CardDescription>
            Recently registered users on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={recentUsers} />
        </CardContent>
      </Card>
    </div>
  );
}