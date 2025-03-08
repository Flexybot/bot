"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChatPlayground } from '@/components/chat/ChatPlayground';
import { EmbedCodeGenerator } from '@/components/chat/EmbedCodeGenerator';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

interface ChatbotData {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  system_prompt: string;
  welcome_message?: string;
  temperature: number;
  model: string;
  is_active: boolean;
  use_rag: boolean;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

interface ClientPageProps {
  id: string;
}

export default function ChatbotPageClient({ id }: ClientPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [chatbot, setChatbot] = useState<ChatbotData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('playground');

  useEffect(() => {
    async function loadChatbot() {
      try {
        const { data, error } = await supabase
          .from('chatbots')
          .select(`
            id,
            name,
            description,
            avatar_url,
            system_prompt,
            welcome_message,
            temperature,
            model,
            is_active,
            use_rag,
            organization_id,
            created_at,
            updated_at
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Chatbot not found');

        setChatbot(data);
      } catch (err: any) {
        console.error('Error loading chatbot:', err);
        setError(err.message || 'Failed to load chatbot');
      } finally {
        setIsLoading(false);
      }
    }

    loadChatbot();
  }, [id]);

  const handleSaveSettings = async (settings: {
    systemPrompt: string;
    temperature: number;
    model: string;
    useRag: boolean;
  }) => {
    try {
      const { error } = await supabase
        .from('chatbots')
        .update({
          system_prompt: settings.systemPrompt,
          temperature: settings.temperature,
          model: settings.model,
          use_rag: settings.useRag,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setChatbot(prev => prev ? {
        ...prev,
        system_prompt: settings.systemPrompt,
        temperature: settings.temperature,
        model: settings.model,
        use_rag: settings.useRag,
      } : null);

    } catch (err: any) {
      console.error('Error saving settings:', err);
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !chatbot) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>
            {error || 'Failed to load chatbot'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.back()}>Go Back</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{chatbot.name}</h2>
          {chatbot.description && (
            <p className="text-muted-foreground">{chatbot.description}</p>
          )}
        </div>
        <Button onClick={() => router.push('/dashboard/chatbots')}>
          Back to Chatbots
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="playground">Playground</TabsTrigger>
          <TabsTrigger value="embed">Embed</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="playground" className="space-y-4">
          <ChatPlayground
            chatbotId={chatbot.id}
            initialSystemPrompt={chatbot.system_prompt}
            initialTemperature={chatbot.temperature}
            initialModel={chatbot.model}
            onSaveSettings={handleSaveSettings}
          />
        </TabsContent>

        <TabsContent value="embed" className="space-y-4">
          <EmbedCodeGenerator
            chatbotId={chatbot.id}
            chatbotName={chatbot.name}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                View usage statistics and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Analytics content will be implemented later */}
              <p className="text-muted-foreground">Analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure your chatbot settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Settings content will be implemented later */}
              <p className="text-muted-foreground">Settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}