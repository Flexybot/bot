import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { stripe } from '@/lib/stripe/server';
import { logger } from '@/lib/logging';

interface HealthStatus {
  status: 'ok' | 'error' | 'degraded';
  timestamp: string;
  version: string;
  environment: string;
  services: {
    database: {
      status: 'ok' | 'error';
      latency?: number;
      message?: string;
    };
    openai: {
      status: 'ok' | 'error' | 'not_checked';
      latency?: number;
      message?: string;
    };
    stripe: {
      status: 'ok' | 'error' | 'not_checked';
      message?: string;
    };
    storage: {
      status: 'ok' | 'error';
      message?: string;
    };
  };
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

export async function GET() {
  const startTime = Date.now();
  let status: HealthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: { status: 'error' },
      openai: { status: 'not_checked' },
      stripe: { status: 'not_checked' },
      storage: { status: 'error' }
    },
    uptime: process.uptime(),
    memory: {
      used: 0,
      total: 0,
      percentage: 0
    }
  };

  try {
    // Check database connection
    const dbStartTime = Date.now();
    const { data: dbData, error: dbError } = await supabase
      .from('health_check')
      .select('*')
      .limit(1)
      .timeout(5000);

    status.services.database = {
      status: dbError ? 'error' : 'ok',
      latency: Date.now() - dbStartTime,
      message: dbError?.message
    };

    // Check storage
    const { data: storageData, error: storageError } = await supabase
      .storage
      .getBucket('documents');

    status.services.storage = {
      status: storageError ? 'error' : 'ok',
      message: storageError?.message
    };

    // Check OpenAI API if key is configured
    if (process.env.OPENAI_API_KEY) {
      const openaiStartTime = Date.now();
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          method: 'GET',
        });
        
        status.services.openai = {
          status: openaiResponse.ok ? 'ok' : 'error',
          latency: Date.now() - openaiStartTime,
          message: openaiResponse.ok ? undefined : await openaiResponse.text()
        };
      } catch (e: any) {
        status.services.openai = {
          status: 'error',
          message: e.message
        };
      }
    }

    // Check Stripe if configured
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        await stripe.paymentMethods.list({ limit: 1 });
        status.services.stripe = {
          status: 'ok'
        };
      } catch (e: any) {
        status.services.stripe = {
          status: 'error',
          message: e.message
        };
      }
    }

    // Get memory usage
    const memoryUsage = process.memoryUsage();
    status.memory = {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
    };

    // Determine overall status
    const serviceStatuses = Object.values(status.services).map(s => s.status);
    if (serviceStatuses.some(s => s === 'error')) {
      status.status = 'error';
    } else if (serviceStatuses.some(s => s === 'degraded')) {
      status.status = 'degraded';
    }

    // Log health check results
    logger.info('Health check completed', {
      duration: Date.now() - startTime,
      status: status.status,
      services: status.services
    });

    return NextResponse.json(status);
  } catch (error: any) {
    logger.error('Health check failed', error);
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        services: status.services
      },
      { status: 500 }
    );
  }
}