"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase/client';
import { Bot, MessageSquare, Users, Clock, AlertTriangle } from 'lucide-react';

interface RealTimeAnalyticsProps {
  refreshInterval?: number; // in milliseconds
}

interface RealTimeMetrics {
  activeUsers: number;
  activeChats: number;
  messagesPerMinute: number;
  responseTimeMs: number;
  activeOrganizations: number;
  chatbotsUsage: Array<{
    id: string;
    name: string;
    count: number;
  }>;
}

const defaultMetrics: RealTimeMetrics = {
  activeUsers: 0,
  activeChats: 0,
  messagesPerMinute: 0,
  responseTimeMs: 0,
  activeOrganizations: 0,
  chatbotsUsage: [],
};

export function RealTimeAnalytics({ refreshInterval = 10000 }: RealTimeAnalyticsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<RealTimeMetrics>(defaultMetrics);

  // Function to fetch real-time metrics
  const fetchRealTimeMetrics = useCallback(async (isInitialLoad: boolean = false) => {
    try {
      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      // Get current time minus 5 minutes
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
      const isoTime = fiveMinutesAgo.toISOString();

      // Get active chats (chats with messages in the last 5 minutes)
      const { count: activeChatsCount } = await supabase
        .from('chats')
        .select('id', { count: 'exact', head: true })
        .gt('updated_at', isoTime);

      // Get active users (users who sent messages in the last 5 minutes)
      const { data: activeUsersData } = await supabase
        .from('messages')
        .select('chats(user_id)')
        .eq('role', 'user')
        .gt('created_at', isoTime);

      // Count unique user IDs
      const uniqueUserIds = new Set(
        activeUsersData?.map(message => message.chats?.user_id).filter(Boolean)
      );

      // Get messages per minute
      const oneMinuteAgo = new Date();
      oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

      const { count: messagesLastMinute } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .gt('created_at', oneMinuteAgo.toISOString());

      // Get average response time for the last 5 minutes
      const { data: responseTimeData } = await supabase
        .from('messages')
        .select('id, chat_id, role, created_at')
        .gt('created_at', isoTime)
        .order('chat_id, created_at');

      // Calculate average response time
      let totalResponseTime = 0;
      let responseCount = 0;

      if (responseTimeData) {
        // Group by chat_id
        const chatMessages = responseTimeData.reduce((acc, msg) => {
          if (!acc[msg.chat_id]) {
            acc[msg.chat_id] = [];
          }
          acc[msg.chat_id].push(msg);
          return acc;
        }, {} as Record<string, typeof responseTimeData>);

        // Calculate response times
        Object.values(chatMessages).forEach(messages => {
          for (let i = 1; i < messages.length; i++) {
            const currMsg = messages[i];
            const prevMsg = messages[i - 1];

            if (currMsg.role === 'assistant' && prevMsg.role === 'user') {
              const responseTime = new Date(currMsg.created_at).getTime() - 
                new Date(prevMsg.created_at).getTime();
              totalResponseTime += responseTime;
              responseCount++;
            }
          }
        });
      }

      // Get active organizations
      const { data: orgData } = await supabase
        .from('messages')
        .select('chats(organization_id)')
        .gt('created_at', isoTime);

      const uniqueOrgIds = new Set(
        orgData?.map(message => message.chats?.organization_id).filter(Boolean)
      );

      // Get chatbot usage
      const { data: chatbotData } = await supabase
        .from('messages')
        .select('chats(chatbot_id, chatbots(name))')
        .gt('created_at', isoTime);

      // Count messages by chatbot
      const chatbotCounts = chatbotData?.reduce((acc, message) => {
        const chatbotId = message.chats?.chatbot_id;
        const chatbotName = message.chats?.chatbots?.name;

        if (chatbotId && chatbotName) {
          if (!acc[chatbotId]) {
            acc[chatbotId] = {
              id: chatbotId,
              name: chatbotName,
              count: 0
            };
          }
          acc[chatbotId].count++;
        }
        return acc;
      }, {} as Record<string, { id: string; name: string; count: number }>);

      // Sort chatbots by message count
      const sortedChatbots = Object.values(chatbotCounts || {})
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Update metrics
      setMetrics({
        activeUsers: uniqueUserIds.size,
        activeChats: activeChatsCount || 0,
        messagesPerMinute: messagesLastMinute || 0,
        responseTimeMs: responseCount ? totalResponseTime / responseCount : 0,
        activeOrganizations: uniqueOrgIds.size,
        chatbotsUsage: sortedChatbots,
      });

    } catch (err: any) {
      console.error('Error fetching real-time metrics:', err);
      setError(err.message || 'Failed to fetch real-time metrics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch and setup refresh interval
  useEffect(() => {
    fetchRealTimeMetrics(true);

    const intervalId = setInterval(() => {
      fetchRealTimeMetrics(false);
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [fetchRealTimeMetrics, refreshInterval]);

  // Helper to format response time
  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Find the total messages across all chatbots
  const totalMessages = metrics.chatbotsUsage.reduce((sum, bot) => sum + bot.count, 0);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Real-Time Analytics</h2>
        <p className="text-muted-foreground">
          Live metrics for the past 5 minutes
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  From {metrics.activeOrganizations} organization{metrics.activeOrganizations !== 1 ? 's' : ''}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-2xl font-bold">{metrics.activeChats}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages/Minute</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-2xl font-bold">{metrics.messagesPerMinute}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-2xl font-bold">{formatResponseTime(metrics.responseTimeMs)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Chatbots</CardTitle>
          <CardDescription>
            Most active chatbots in the last 5 minutes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : metrics.chatbotsUsage.length > 0 ? (
            <div className="space-y-4">
              {metrics.chatbotsUsage.map((bot) => (
                <div key={bot.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Bot className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium">{bot.name}</span>
                    </div>
                    <Badge variant="secondary">{bot.count} msgs</Badge>
                  </div>
                  <Progress 
                    value={(bot.count / totalMessages) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No active chatbots in the last 5 minutes
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}