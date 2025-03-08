"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Save, Bot } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/lib/supabase/client';

export default function PlaygroundClient({ id }: { id: string }) {
  const { currentOrganization } = useOrganization();
  const [chatbot, setChatbot] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    systemPrompt: '',
    temperature: 0.7,
    useRag: true,
  });

  // Load chatbot data
  useState(() => {
    async function loadChatbot() {
      if (!id || !currentOrganization) return;

      try {
        const { data, error } = await supabase
          .from('chatbots')
          .select('*')
          .eq('id', id)
          .eq('organization_id', currentOrganization.id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Chatbot not found');

        setChatbot(data);
        setSettings({
          systemPrompt: data.system_prompt,
          temperature: data.temperature,
          useRag: data.use_rag ?? true,
        });
      } catch (error) {
        console.error('Error loading chatbot:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadChatbot();
  }, [id, currentOrganization]);

  // Save settings
  const handleSaveSettings = async () => {
    if (!chatbot) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('chatbots')
        .update({
          system_prompt: settings.systemPrompt,
          temperature: settings.temperature,
          use_rag: settings.useRag,
          updated_at: new Date().toISOString(),
        })
        .eq('id', chatbot.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!chatbot) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Chatbot not found</h2>
          <p className="text-muted-foreground">
            The chatbot you're looking for doesn't exist or you don't have access to it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Settings Panel */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Playground Settings</CardTitle>
          <CardDescription>
            Test your chatbot with different settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt</Label>
            <Input
              id="systemPrompt"
              value={settings.systemPrompt}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                systemPrompt: e.target.value
              }))}
              placeholder="Instructions for how the AI should behave..."
            />
            <p className="text-xs text-muted-foreground">
              Define the AI's personality and behavior
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="temperature">Temperature</Label>
            <Select
              value={settings.temperature.toString()}
              onValueChange={(value) => setSettings(prev => ({
                ...prev,
                temperature: parseFloat(value)
              }))}
            >
              <SelectTrigger id="temperature">
                <SelectValue placeholder="Select temperature" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.2">0.2 - More focused</SelectItem>
                <SelectItem value="0.5">0.5 - Balanced</SelectItem>
                <SelectItem value="0.7">0.7 - Default</SelectItem>
                <SelectItem value="0.9">0.9 - More creative</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Controls randomness: lower for factual, higher for creative
            </p>
          </div>

          <div className="pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="useKnowledge">Knowledge Base</Label>
                <p className="text-xs text-muted-foreground">
                  Use documents to answer questions
                </p>
              </div>
              <Switch
                id="useKnowledge"
                checked={settings.useRag}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  useRag: checked
                }))}
              />
            </div>
          </div>

          <Separator className="my-4" />

          <Button
            className="w-full"
            onClick={handleSaveSettings}
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Test Your Chatbot</CardTitle>
          <CardDescription>
            Interact with your chatbot to test its responses
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ChatInterface
            chatbotId={chatbot.id}
            chatbotName={chatbot.name}
            initialSystemPrompt={settings.systemPrompt}
            temperature={settings.temperature}
            showSettings={true}
            isPlayground={true}
            className="h-[600px] border-0"
          />
        </CardContent>
      </Card>
    </div>
  );
}