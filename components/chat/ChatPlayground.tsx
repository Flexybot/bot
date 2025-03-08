"use client";

import { useState } from 'react';
import { ChatInterface } from './ChatInterface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatPlaygroundProps {
  chatbotId: string;
  initialSystemPrompt?: string;
  initialTemperature?: number;
  initialModel?: string;
  onSaveSettings?: (settings: {
    systemPrompt: string;
    temperature: number;
    model: string;
    useRag: boolean;
  }) => Promise<void>;
}

export function ChatPlayground({
  chatbotId,
  initialSystemPrompt = 'You are a helpful AI assistant.',
  initialTemperature = 0.7,
  initialModel = 'gpt-3.5-turbo',
  onSaveSettings,
}: ChatPlaygroundProps) {
  const { toast } = useToast();
  const [systemPrompt, setSystemPrompt] = useState(initialSystemPrompt);
  const [temperature, setTemperature] = useState(initialTemperature);
  const [model, setModel] = useState(initialModel);
  const [useRag, setUseRag] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSaveSettings = async () => {
    if (!onSaveSettings) return;
    
    setIsSaving(true);
    try {
      await onSaveSettings({
        systemPrompt,
        temperature,
        model,
        useRag,
      });
      
      toast({
        title: 'Settings saved',
        description: 'Your chatbot settings have been updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error saving settings',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
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
            <Textarea
              id="systemPrompt"
              className="min-h-[120px]"
              placeholder="Instructions for how the AI should behave..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Define the AI's personality and behavior
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Temperature: {temperature}</Label>
            </div>
            <div className="pt-2">
              <Slider
                id="temperature"
                min={0}
                max={1}
                step={0.1}
                value={[temperature]}
                onValueChange={(value) => setTemperature(value[0])}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground pt-1">
              <span>Deterministic</span>
              <span>Creative</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select
              value={model}
              onValueChange={setModel}
            >
              <SelectTrigger id="model">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select the AI model for your chatbot
            </p>
          </div>
          
          <div className="pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="useRag">Knowledge Base</Label>
                <p className="text-xs text-muted-foreground">
                  Use documents to answer questions
                </p>
              </div>
              <Switch 
                id="useRag" 
                checked={useRag}
                onCheckedChange={setUseRag}
              />
            </div>
          </div>
          
          {onSaveSettings && (
            <Button 
              className="w-full mt-4" 
              onClick={handleSaveSettings}
              disabled={isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          )}
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Test Your Chatbot</CardTitle>
          <CardDescription>
            Interact with your chatbot to test its responses
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ChatInterface 
            chatbotId={chatbotId}
            initialSystemPrompt={systemPrompt}
            temperature={temperature}
            showSettings={true}
            isPlayground={true}
            chatbotName="Playground"
            className="h-[600px] border-0"
          />
        </CardContent>
      </Card>
    </div>
  );
}