"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, Send, User, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ChatInterfaceProps {
  chatbotId: string;
  initialSystemPrompt?: string;
  temperature?: number;
  showSettings?: boolean;
  isPlayground?: boolean;
  chatbotName?: string;
  chatbotAvatar?: string;
  welcomeMessage?: string;
  className?: string;
  apiEndpoint?: string;
}

export function ChatInterface({
  chatbotId,
  initialSystemPrompt = "You are a helpful AI assistant.",
  temperature = 0.7,
  showSettings = false,
  isPlayground = false,
  chatbotName = "AI Assistant",
  chatbotAvatar,
  welcomeMessage = "Hello! How can I help you today?",
  className,
  apiEndpoint = '/api/chat'
}: ChatInterfaceProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Add welcome message on mount
  useEffect(() => {
    if (welcomeMessage) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date().toISOString()
      }]);
    }
  }, [welcomeMessage]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          systemPrompt: initialSystemPrompt,
          temperature,
          chatbotId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      let responseText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Convert the chunk to text
          const chunk = new TextDecoder().decode(value);
          responseText += chunk;

          // Update the message in real-time
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage?.role === 'assistant') {
              return [...prev.slice(0, -1), {
                ...lastMessage,
                content: responseText
              }];
            } else {
              return [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: responseText,
                timestamp: new Date().toISOString()
              }];
            }
          });
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const resetChat = () => {
    setMessages(welcomeMessage ? [{
      id: 'welcome',
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date().toISOString()
    }] : []);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-[600px] bg-background border rounded-lg overflow-hidden",
      className
    )}>
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            {chatbotAvatar ? (
              <AvatarImage src={chatbotAvatar} alt={chatbotName} />
            ) : (
              <AvatarFallback>
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h3 className="text-sm font-medium">{chatbotName}</h3>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'Typing...' : 'Online'}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={resetChat}
          title="Reset conversation"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-start space-x-2",
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <Avatar className="h-8 w-8 mt-1">
                {chatbotAvatar ? (
                  <AvatarImage src={chatbotAvatar} alt={chatbotName} />
                ) : (
                  <AvatarFallback className="bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </AvatarFallback>
                )}
              </Avatar>
            )}
            
            <div
              className={cn(
                "rounded-lg px-4 py-2 max-w-[80%] space-y-2",
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
            
            {message.role === 'user' && (
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback className="bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              {chatbotAvatar ? (
                <AvatarImage src={chatbotAvatar} alt={chatbotName} />
              ) : (
                <AvatarFallback className="bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </AvatarFallback>
              )}
            </Avatar>
            <div className="rounded-lg px-4 py-2 bg-muted">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[44px] max-h-32"
            rows={1}
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isLoading || input.trim() === ''}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}