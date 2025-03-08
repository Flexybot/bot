"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { addDays, subDays } from 'date-fns';

export default function AnalyticsPage() {
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Monitor your chatbot performance and user engagement
          </p>
        </div>
        <DatePickerWithRange
          date={dateRange}
          onDateChange={handleDateChange}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            Key metrics and performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnalyticsDashboard
            dateRange={dateRange}
            showChatbotFilter={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}