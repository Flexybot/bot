"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Bot, MessageSquare, Users, Settings, MoreVertical, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useOrganization } from '@/hooks/useOrganization';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UsageLimitAlert } from '@/components/billing/UsageLimitAlert';

export default function ChatbotsPage() {
  const { currentOrganization } = useOrganization();
  const [isLoading, setIsLoading] = useState(true);
  const [chatbots, setChatbots] = useState<any[]>([]);

  // Sample chatbots data for demonstration
  const sampleChatbots = [
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Chatbots</h2>
        <Button asChild>
          <Link href="/dashboard/chatbots/new">
            <Plus className="mr-2 h-4 w-4" />
            New Chatbot
          </Link>
        </Button>
      </div>

      <UsageLimitAlert
        resourceType="chatbots"
        action="create a new chatbot"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sampleChatbots.map((chatbot) => (
          <Card key={chatbot.id} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">{chatbot.name}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/chatbots/${chatbot.id}`}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/chatbots/${chatbot.id}/playground`}>
                        <Bot className="mr-2 h-4 w-4" />
                        <span>Playground</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      <span>View Live</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
              <div className="flex items-center space-x-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/dashboard/chatbots/${chatbot.id}/playground`}>
                    Test
                  </Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link href={`/dashboard/chatbots/${chatbot.id}`}>
                    Manage
                  </Link>
                </Button>
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
            <Button asChild>
              <Link href="/dashboard/chatbots/new">
                <Plus className="mr-2 h-4 w-4" />
                New Chatbot
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}