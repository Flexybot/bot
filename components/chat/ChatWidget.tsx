"use client";

import { useState, useEffect, useCallback } from 'react';
import { ChatInterface } from './ChatInterface';
import { Button } from '@/components/ui/button';
import { MessageSquare, X, Maximize2, Minimize2 } from 'lucide-react';

interface ChatWidgetProps {
  chatbotId: string;
  apiEndpoint?: string;
  position?: 'right' | 'left';
  welcomeMessage?: string;
  chatbotName?: string;
  chatbotAvatar?: string;
  primaryColor?: string;
  darkMode?: boolean;
  autoOpen?: boolean;
  defaultOpen?: boolean;
  openOnMessage?: boolean;
}

export function ChatWidget({
  chatbotId,
  apiEndpoint = '/api/chat',
  position = 'right',
  welcomeMessage = "Hello! How can I help you today?",
  chatbotName = "AI Assistant",
  chatbotAvatar,
  primaryColor = "#4F46E5",
  darkMode = false,
  autoOpen = false,
  defaultOpen = false,
  openOnMessage = true,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Toggle the chat widget
  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);
  
  // Toggle expanded mode
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);
  
  // Auto-open after a delay if enabled
  useEffect(() => {
    if (autoOpen && !isOpen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [autoOpen, isOpen]);
  
  // Handle keydown events for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);
  
  // Apply custom CSS variables for theming
  useEffect(() => {
    const root = document.documentElement;
    const originalPrimary = getComputedStyle(root).getPropertyValue('--primary');
    
    root.style.setProperty('--chat-primary', primaryColor);
    
    return () => {
      root.style.setProperty('--primary', originalPrimary);
    };
  }, [primaryColor]);
  
  // Add message listener if openOnMessage is enabled
  useEffect(() => {
    if (!openOnMessage) return;
    
    const messageListener = (event: MessageEvent) => {
      if (event.data?.type === 'OPEN_CHATBOT' && event.data?.chatbotId === chatbotId) {
        setIsOpen(true);
      }
    };
    
    window.addEventListener('message', messageListener);
    return () => window.removeEventListener('message', messageListener);
  }, [openOnMessage, chatbotId]);
  
  return (
    <div 
      className={`fixed z-50 ${position === 'right' ? 'right-4' : 'left-4'} ${
        isOpen
          ? isExpanded
            ? 'inset-4'
            : 'bottom-4 w-80 sm:w-96'
          : 'bottom-4'
      } transition-all duration-300 ease-in-out`}
      data-chatbot-id={chatbotId}
      data-theme={darkMode ? 'dark' : 'light'}
    >
      {isOpen ? (
        <div 
          className={`flex flex-col ${
            isExpanded 
              ? 'h-full'
              : 'h-[600px] max-h-[80vh]'
          } rounded-lg shadow-xl overflow-hidden border bg-background`}
        >
          <div 
            className="flex items-center justify-between p-3 border-b"
            style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
          >
            <h2 className="text-sm font-medium text-white">{chatbotName}</h2>
            <div className="flex items-center space-x-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-white hover:bg-white/20"
                onClick={toggleExpanded}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                <span className="sr-only">{isExpanded ? 'Minimize' : 'Maximize'}</span>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-white hover:bg-white/20"
                onClick={toggleChat}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <ChatInterface 
              chatbotId={chatbotId}
              apiEndpoint={apiEndpoint}
              welcomeMessage={welcomeMessage}
              chatbotName={chatbotName}
              chatbotAvatar={chatbotAvatar}
              className="border-none shadow-none rounded-none h-full"
            />
          </div>
        </div>
      ) : (
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          style={{ backgroundColor: primaryColor }}
          onClick={toggleChat}
        >
          <MessageSquare className="h-6 w-6 text-white" />
          <span className="sr-only">Open chat</span>
        </Button>
      )}
    </div>
  );
}