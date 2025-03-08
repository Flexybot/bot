import { z } from 'zod';

// Configuration schema with validation
const configSchema = z.object({
  app: z.object({
    name: z.string(),
    version: z.string(),
    url: z.string().url(),
    apiUrl: z.string().url(),
    buildId: z.string().optional(),
    buildDate: z.string().datetime().optional(),
  }),
  env: z.enum(['development', 'staging', 'production']),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']),
  ai: z.object({
    model: z.string(),
    temperature: z.number().min(0).max(1),
    maxTokens: z.number().positive(),
    provider: z.enum(['openai']),
  }),
  upload: z.object({
    maxSizeMb: z.number().positive(),
    allowedTypes: z.array(z.string()),
  }),
  features: z.object({
    debug: z.boolean(),
    analytics: z.boolean(),
    feedback: z.boolean(),
    experimental: z.boolean(),
  }),
  services: z.object({
    supabase: z.object({
      url: z.string().url(),
      anonKey: z.string(),
    }),
    stripe: z.object({
      publishableKey: z.string().optional(),
      webhookSecret: z.string().optional(),
    }),
  }),
});

// Type inference from schema
type Config = z.infer<typeof configSchema>;

// Environment-specific configurations
const development: Config = {
  app: {
    name: 'FlexyBot',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    buildId: process.env.NEXT_PUBLIC_BUILD_ID,
    buildDate: process.env.NEXT_PUBLIC_BUILD_DATE,
  },
  env: 'development',
  logLevel: 'debug',
  ai: {
    model: 'gpt-3.5-turbo', // Use cheaper model in dev
    temperature: 0.7,
    maxTokens: 2000,
    provider: 'openai',
  },
  upload: {
    maxSizeMb: 50,
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
    ],
  },
  features: {
    debug: true,
    analytics: false, // Disable analytics in dev
    feedback: true,
    experimental: true, // Enable experimental features
  },
  services: {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    },
    stripe: {
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
  },
};

const production: Config = {
  app: {
    name: 'FlexyBot',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://flexybot.com',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://flexybot.com/api',
    buildId: process.env.NEXT_PUBLIC_BUILD_ID,
    buildDate: process.env.NEXT_PUBLIC_BUILD_DATE,
  },
  env: 'production',
  logLevel: 'error', // Log only errors in production
  ai: {
    model: 'gpt-4', // Use better model in production
    temperature: 0.7,
    maxTokens: 4000,
    provider: 'openai',
  },
  upload: {
    maxSizeMb: 50,
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
    ],
  },
  features: {
    debug: false,
    analytics: true, // Enable analytics in production
    feedback: true,
    experimental: false, // Disable experimental features
  },
  services: {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    },
    stripe: {
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
  },
};

const staging: Config = {
  app: {
    name: 'FlexyBot (Staging)',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://staging.flexybot.com',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://staging.flexybot.com/api',
    buildId: process.env.NEXT_PUBLIC_BUILD_ID,
    buildDate: process.env.NEXT_PUBLIC_BUILD_DATE,
  },
  env: 'staging',
  logLevel: 'info',
  ai: {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 2000,
    provider: 'openai',
  },
  upload: {
    maxSizeMb: 50,
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
    ],
  },
  features: {
    debug: true,
    analytics: true,
    feedback: true,
    experimental: true,
  },
  services: {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    },
    stripe: {
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
  },
};

// Environment-specific config mapping
const configs: Record<Config['env'], Config> = {
  development,
  production,
  staging,
};

// Determine current environment
const env = (process.env.NODE_ENV || 'development') as Config['env'];

// Get correct config and validate
const envConfig = configs[env];
const config = configSchema.parse(envConfig);

// Feature flags with conditional logic
export const featureFlags = {
  enableAnalytics: config.features.analytics && config.env !== 'development',
  enableDebug: config.features.debug || config.env === 'development',
  enableFeedback: config.features.feedback,
  enableExperimental: config.features.experimental || config.env !== 'production',
  enableRealTimeAnalytics: config.env === 'production',
  enableApiMonitoring: config.env !== 'development',
  enablePerformanceMetrics: config.env === 'production',
  enableErrorReporting: true,
  enableUsageTracking: config.env !== 'development',
};

// Constants derived from config
export const constants = {
  MAX_UPLOAD_SIZE: config.upload.maxSizeMb * 1024 * 1024, // Convert to bytes
  ALLOWED_FILE_TYPES: config.upload.allowedTypes,
  DEFAULT_AI_MODEL: config.ai.model,
  DEFAULT_TEMPERATURE: config.ai.temperature,
  MAX_TOKENS: config.ai.maxTokens,
  API_TIMEOUT: config.env === 'production' ? 30000 : 60000, // 30s prod, 60s dev
  CACHE_TTL: config.env === 'production' ? 3600 : 0, // 1 hour in prod, no cache in dev
  RATE_LIMIT: {
    window: 60 * 1000, // 1 minute
    max: config.env === 'production' ? 100 : 1000, // Requests per window
  },
};

// Helper functions
export const isProduction = () => config.env === 'production';
export const isDevelopment = () => config.env === 'development';
export const isStaging = () => config.env === 'staging';
export const getApiUrl = () => config.app.apiUrl;
export const getAppUrl = () => config.app.url;
export const getLogLevel = () => config.logLevel;
export const getSupabaseConfig = () => config.services.supabase;
export const getStripeConfig = () => config.services.stripe;

export default config;