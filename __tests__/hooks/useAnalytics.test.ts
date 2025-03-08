import { renderHook, act } from '@testing-library/react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { analyticsFetcher } from '@/lib/analytics/client';

jest.mock('@/lib/analytics/client', () => ({
  analyticsFetcher: {
    getOverview: jest.fn(),
    getTimeSeriesData: jest.fn(),
    getChatbotStats: jest.fn(),
    getFeedbackStats: jest.fn(),
    getTopQuestions: jest.fn(),
  },
}));

describe('useAnalytics', () => {
  const mockDateRange = {
    from: new Date('2024-01-01'),
    to: new Date('2024-01-31'),
  };

  const mockOverview = {
    totalMessages: 1000,
    totalSessions: 100,
    totalUsers: 50,
    avgResponseTime: 1500,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (analyticsFetcher.getOverview as jest.Mock).mockResolvedValue(mockOverview);
    (analyticsFetcher.getTimeSeriesData as jest.Mock).mockResolvedValue([]);
    (analyticsFetcher.getChatbotStats as jest.Mock).mockResolvedValue([]);
    (analyticsFetcher.getFeedbackStats as jest.Mock).mockResolvedValue([]);
    (analyticsFetcher.getTopQuestions as jest.Mock).mockResolvedValue([]);
  });

  it('should fetch analytics data on mount', async () => {
    const { result } = renderHook(() => useAnalytics({
      organizationId: 'org-123',
      dateRange: mockDateRange,
    }));

    expect(result.current.isLoading).toBe(true);
    expect(analyticsFetcher.getOverview).toHaveBeenCalledWith(
      'org-123',
      mockDateRange,
      undefined
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.overview).toEqual(mockOverview);
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Failed to fetch');
    (analyticsFetcher.getOverview as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useAnalytics({
      organizationId: 'org-123',
      dateRange: mockDateRange,
    }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.isLoading).toBe(false);
  });

  it('should refresh data when called', async () => {
    const { result } = renderHook(() => useAnalytics({
      organizationId: 'org-123',
      dateRange: mockDateRange,
    }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(analyticsFetcher.getOverview).toHaveBeenCalledTimes(2);
  });
});