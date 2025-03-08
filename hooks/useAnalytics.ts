"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  analyticsFetcher, 
  AnalyticsDateRange, 
  AnalyticsOverview, 
  ChatbotStats, 
  DateStat, 
  FeedbackStat, 
  TopQuestion 
} from '@/lib/analytics/client';

interface UseAnalyticsOptions {
  organizationId: string | undefined;
  dateRange: AnalyticsDateRange;
  chatbotId?: string;
  enabled?: boolean;
  refreshInterval?: number;
}

interface UseAnalyticsResult {
  isLoading: boolean;
  error: Error | null;
  overview: AnalyticsOverview;
  timeSeriesData: DateStat[];
  chatbotStats: ChatbotStats[];
  feedbackStats: FeedbackStat[];
  topQuestions: TopQuestion[];
  refresh: () => Promise<void>;
  isRefreshing: boolean;
}

const defaultOverview: AnalyticsOverview = {
  totalMessages: 0,
  totalSessions: 0,
  totalUsers: 0,
  avgResponseTime: 0
};

export function useAnalytics({
  organizationId,
  dateRange,
  chatbotId,
  enabled = true,
  refreshInterval = 0
}: UseAnalyticsOptions): UseAnalyticsResult {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [overview, setOverview] = useState<AnalyticsOverview>(defaultOverview);
  const [timeSeriesData, setTimeSeriesData] = useState<DateStat[]>([]);
  const [chatbotStats, setChatbotStats] = useState<ChatbotStats[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStat[]>([]);
  const [topQuestions, setTopQuestions] = useState<TopQuestion[]>([]);

  const fetchData = useCallback(async (isInitialLoad: boolean = false) => {
    if (!organizationId || !enabled) return;

    try {
      // Set loading state appropriately
      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      // Fetch all data in parallel
      const [
        overviewData,
        timeData,
        chatbotsData,
        feedbackData,
        questionsData
      ] = await Promise.all([
        analyticsFetcher.getOverview(organizationId, dateRange, chatbotId),
        analyticsFetcher.getTimeSeriesData(organizationId, dateRange, chatbotId),
        analyticsFetcher.getChatbotStats(organizationId, dateRange, chatbotId),
        analyticsFetcher.getFeedbackStats(organizationId, dateRange, chatbotId),
        analyticsFetcher.getTopQuestions(organizationId, dateRange, chatbotId)
      ]);

      // Update state with fetched data
      setOverview(overviewData);
      setTimeSeriesData(timeData);
      setChatbotStats(chatbotsData);
      setFeedbackStats(feedbackData);
      setTopQuestions(questionsData);

    } catch (err: any) {
      console.error('Error fetching analytics data:', err);
      setError(new Error(err.message || 'Failed to fetch analytics data'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [organizationId, dateRange.from, dateRange.to, chatbotId, enabled]);

  // Initial data fetch
  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Set up auto-refresh if interval is provided
  useEffect(() => {
    if (!refreshInterval || !enabled) return;

    const intervalId = setInterval(() => {
      fetchData(false);
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, enabled, fetchData]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchData(false);
  }, [fetchData]);

  return {
    isLoading,
    isRefreshing,
    error,
    overview,
    timeSeriesData,
    chatbotStats,
    feedbackStats,
    topQuestions,
    refresh
  };
}