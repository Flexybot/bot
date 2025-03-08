"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface ChatbotData {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  system_prompt: string;
  welcome_message?: string;
  temperature: number;
  is_active: boolean;
  organization_id: string;
}

export default function EmbedPageClient({ chatbotId }: { chatbotId: string }) {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [chatbotData, setChatbotData] = useState<ChatbotData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Get customization options from URL params
  const primaryColor = searchParams.get('primaryColor') || '#4F46E5';
  const position = searchParams.get('position') || 'right';
  const darkMode = searchParams.get('darkMode') === 'true';
  const autoOpen = searchParams.get('autoOpen') === 'true';
  const welcomeMessage = searchParams.get('welcomeMessage');
  
  // Fetch chatbot data
  useEffect(() => {
    async function fetchChatbot() {
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
            is_active,
            organization_id
          `)
          .eq('id', chatbotId)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Chatbot not found');

        // Check if chatbot is active
        if (!data.is_active) {
          throw new Error('This chatbot is currently inactive');
        }

        setChatbotData(data);
      } catch (err: any) {
        console.error('Error fetching chatbot:', err);
        setError(err.message || 'Failed to load chatbot');
      } finally {
        setIsLoading(false);
      }
    }

    fetchChatbot();
  }, [chatbotId]);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !chatbotData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold text-destructive">Error</h2>
          <p className="text-muted-foreground">{error || 'Failed to load chatbot'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <ChatWidget
        chatbotId={chatbotId}
        position={position as 'right' | 'left'}
        primaryColor={primaryColor}
        darkMode={darkMode}
        autoOpen={autoOpen}
        defaultOpen={true}
        welcomeMessage={welcomeMessage || chatbotData.welcome_message}
        chatbotName={chatbotData.name}
        chatbotAvatar={chatbotData.avatar_url}
      />
    </div>
  );
}