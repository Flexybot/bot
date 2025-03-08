import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Bot } from 'lucide-react';
import Link from 'next/link';

export default function ConversationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Conversations</h2>
        <Button asChild>
          <Link href="/dashboard/chatbots/new">
            <Bot className="mr-2 h-4 w-4" />
            New Chatbot
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
          <CardDescription>
            View and manage your chatbot conversations
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-4">
            Create a chatbot and start engaging with your users to see conversations here.
          </p>
          <Button asChild>
            <Link href="/dashboard/chatbots/new">Create Your First Chatbot</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}