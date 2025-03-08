export interface AnalyticsDateRange {
  from: Date;
  to: Date;
}

export interface AnalyticsOverview {
  totalMessages: number;
  totalSessions: number;
  totalUsers: number;
  avgResponseTime: number;
}

export interface DateStat {
  date: string;
  count: number;
}

export interface ChatbotStats {
  id: string;
  name: string;
  messageCount: number;
  userCount: number;
  avgResponseTime: number;
}

export interface FeedbackStat {
  positive: number;
  negative: number;
  total: number;
}

export interface TopQuestion {
  question: string;
  count: number;
}

export const analyticsFetcher = {
  async getOverview(
    organizationId: string,
    dateRange: AnalyticsDateRange,
    chatbotId?: string
  ): Promise<AnalyticsOverview> {
    // Implement actual API call here
    return {
      totalMessages: 1000,
      totalSessions: 100,
      totalUsers: 50,
      avgResponseTime: 1500,
    };
  },

  async getTimeSeriesData(
    organizationId: string,
    dateRange: AnalyticsDateRange,
    chatbotId?: string
  ): Promise<DateStat[]> {
    // Implement actual API call here
    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      count: Math.floor(Math.random() * 1000),
    }));
  },

  async getChatbotStats(
    organizationId: string,
    dateRange: AnalyticsDateRange,
    chatbotId?: string
  ): Promise<ChatbotStats[]> {
    // Implement actual API call here
    return [];
  },

  async getFeedbackStats(
    organizationId: string,
    dateRange: AnalyticsDateRange,
    chatbotId?: string
  ): Promise<FeedbackStat[]> {
    // Implement actual API call here
    return [];
  },

  async getTopQuestions(
    organizationId: string,
    dateRange: AnalyticsDateRange,
    chatbotId?: string
  ): Promise<TopQuestion[]> {
    // Implement actual API call here
    return [];
  },
};