"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Bot, 
  Users, 
  BarChart, 
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  Plus
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useOrganization } from '@/hooks/useOrganization';
import Link from 'next/link';

// Sample data for charts
const messageData = [
  { name: 'Jan', count: 400 },
  { name: 'Feb', count: 600 },
  { name: 'Mar', count: 500 },
  { name: 'Apr', count: 700 },
  { name: 'May', count: 1000 },
  { name: 'Jun', count: 800 },
  { name: 'Jul', count: 1500 },
  { name: 'Aug', count: 1700 },
  { name: 'Sep', count: 1900 },
  { name: 'Oct', count: 2000 },
  { name: 'Nov', count: 2500 },
  { name: 'Dec', count: 2300 },
];

// Chart components with default parameters
const CustomXAxis = ({ 
  dataKey = "name",
  padding = { left: 10, right: 10 },
  tick = { fontSize: 12 },
  tickLine = false,
  axisLine = false,
  ...props 
}) => (
  <XAxis 
    dataKey={dataKey}
    padding={padding}
    tick={tick}
    tickLine={tickLine}
    axisLine={axisLine}
    {...props}
  />
);

const CustomYAxis = ({
  width = 80,
  tick = { fontSize: 12 },
  tickLine = false,
  axisLine = false,
  tickFormatter = (value: number) => `${value.toLocaleString()}`,
  ...props
}) => (
  <YAxis
    width={width}
    tick={tick}
    tickLine={tickLine}
    axisLine={axisLine}
    tickFormatter={tickFormatter}
    {...props}
  />
);

const CustomTooltip = ({
  formatter = (value: number) => [`${value.toLocaleString()} messages`, 'Messages'],
  labelFormatter = (label: string) => label,
  contentStyle = {
    backgroundColor: 'var(--background)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '8px 12px',
  },
  ...props
}) => (
  <Tooltip
    formatter={formatter}
    labelFormatter={labelFormatter}
    contentStyle={contentStyle}
    {...props}
  />
);

// Sample chatbot data
const recentChatbots = [
  {
    id: '1',
    name: 'Customer Support Bot',
    description: 'Handles common customer inquiries and support tickets',
    messagesCount: 1248,
    usersCount: 145,
    lastActive: '2 hours ago'
  },
  {
    id: '2',
    name: 'Product FAQ Assistant',
    description: 'Answers questions about our product features and pricing',
    messagesCount: 956,
    usersCount: 87,
    lastActive: '5 hours ago'
  },
  {
    id: '3',
    name: 'Onboarding Guide',
    description: 'Helps new users learn about our platform',
    messagesCount: 531,
    usersCount: 62,
    lastActive: '1 day ago'
  }
];

export default function TenantDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <Link href="/dashboard/chatbots/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Chatbot
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">149,758</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
              <span className="text-green-500 font-medium">18%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Chatbots</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
              <span className="text-green-500 font-medium">2</span> new this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">486</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
              <span className="text-green-500 font-medium">10%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2s</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowDown className="mr-1 h-4 w-4 text-green-500" />
              <span className="text-green-500 font-medium">12%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Messages Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Message Volume</CardTitle>
          <CardDescription>
            Number of messages processed by all your chatbots
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={messageData}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <CustomXAxis dataKey="name" />
                <CustomYAxis />
                <CustomTooltip />
                <Line
                  type="monotone"
                  dataKey="count"
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

      {/* Recent Chatbots */}
      <h3 className="text-xl font-semibold mt-6">Your Chatbots</h3>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {recentChatbots.map((chatbot) => (
          <Card key={chatbot.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">{chatbot.name}</CardTitle>
              <CardDescription className="line-clamp-2">{chatbot.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm mb-4">
                <div>
                  <div className="text-muted-foreground">Messages</div>
                  <div className="font-medium">{chatbot.messagesCount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Users</div>
                  <div className="font-medium">{chatbot.usersCount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Last Active</div>
                  <div className="font-medium">{chatbot.lastActive}</div>
                </div>
              </div>
              <div className="flex justify-between items-center space-x-2">
                <Button variant="outline" className="w-full">
                  Preview
                </Button>
                <Link href={`/dashboard/chatbots/${chatbot.id}`} className="w-full">
                  <Button className="w-full">
                    Manage
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Add New Chatbot Card */}
        <Card className="border-dashed">
          <CardContent className="pt-6 flex flex-col items-center justify-center h-full min-h-[220px]">
            <div className="rounded-full bg-primary/10 p-3 mb-3">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-1">Create New Chatbot</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Create a new AI chatbot trained on your data
            </p>
            <Link href="/dashboard/chatbots/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Chatbot
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}