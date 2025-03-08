"use client";

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Log to monitoring service if available
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-background">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                An unexpected error occurred. Our team has been notified.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>Error Details</AlertTitle>
                  <AlertDescription>
                    <div className="font-mono text-sm mt-2 p-2 bg-muted/50 rounded-md overflow-auto">
                      {this.state.error.toString()}
                    </div>
                    {this.state.error.stack && (
                      <div className="font-mono text-xs mt-2 text-muted-foreground">
                        {this.state.error.stack.split('\n').slice(1, 4).join('\n')}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              
              <p className="text-sm text-muted-foreground">
                Try refreshing the page or going back to the previous page. If the problem persists, 
                please contact support.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
              >
                Go Back
              </Button>
              <Button 
                onClick={() => {
                  this.handleReset();
                  window.location.reload();
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}