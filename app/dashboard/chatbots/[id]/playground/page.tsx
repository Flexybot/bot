"use client";

import { Suspense } from 'react';
import { ChatPlayground } from '@/components/chat/ChatPlayground';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function PlaygroundPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Chatbot Playground</h2>
        <p className="text-muted-foreground">
          Test and configure your chatbot responses
        </p>
      </div>

      <Suspense fallback={
        <Card>
          <CardContent className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      }>
        <ChatPlayground 
          chatbotId={params.id}
          initialSystemPrompt="You are a helpful AI assistant."
          initialTemperature={0.7}
          initialModel="gpt-3.5-turbo"
        />
      </Suspense>
    </div>
  );
}