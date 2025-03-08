"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { RealTimeAnalytics } from '@/components/admin/RealTimeAnalytics';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { addDays, subDays } from 'date-fns';

export default function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('real-time');
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Handle date range change
  const handleDateChange = (range: { from: Date; to: Date } | undefined) => {
    if (range) {
      setDateRange(range);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Platform Analytics</h2>
        <p className="text-muted-foreground">
          Monitor platform usage and performance metrics
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'real-time' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}
            onClick={() => setActiveTab('real-time')}
          >
            Real-time
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'historical' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}
            onClick={() => setActiveTab('historical')}
          >
            Historical
          </button>
        </div>

        {activeTab === 'historical' && (
          <DatePickerWithRange
            date={dateRange}
            onDateChange={handleDateChange}
          />
        )}
      </div>

      {activeTab === 'real-time' ? (
        <RealTimeAnalytics refreshInterval={10000} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Historical Analytics</CardTitle>
            <CardDescription>
              View historical usage and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsDashboard
              dateRange={dateRange}
              showChatbotFilter={false}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}