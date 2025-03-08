const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // React configuration
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization configuration
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Compression
  compress: true,
  
  // Handle trailing slashes
  trailingSlash: false,
  
  // Configure headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'production'
              ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.openai.com https://*.stripe.com; frame-src https://*.stripe.com; worker-src 'self' blob:;"
              : '',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },
  
  // Configure redirects
  async redirects() {
    return [
      {
        source: '/help-center',
        destination: '/help',
        permanent: true,
      },
      {
        source: '/documentation',
        destination: '/docs',
        permanent: true,
      },
      {
        source: '/signup',
        destination: '/auth/signup',
        permanent: true,
      },
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true,
      },
    ];
  },
  
  // Webpack optimization
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle in production
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      };
    }

    // Handle WebSocket polyfills
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        bufferutil: false,
        'utf-8-validate': false,
      };
    }

    return config;
  },
  
  // Environment variables to expose to the client
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
    NEXT_PUBLIC_BUILD_DATE: new Date().toISOString(),
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
  },
  
  // Enable experimental features
  experimental: {
    optimizeCss: true,
    typedRoutes: true,
    scrollRestoration: true,
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  
  // Output configuration
  output: 'standalone',
  
  // Increase build output detail
  logging: {
    level: process.env.NODE_ENV === 'development' ? 'verbose' : 'warn',
    buildVerbosity: process.env.NODE_ENV === 'development' ? 'verbose' : 'info',
  },
  
  // Configure build output
  poweredByHeader: false,
  generateEtags: true,

  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  hideSourceMaps: true,
  silent: true, // Suppresses all logs
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  transpileClientSDK: true,
  tunnelRoute: '/monitoring',
  hideSourcemaps: true,
  disableServerWebpackPlugin: false,
  disableClientWebpackPlugin: false,
};

// Export config with Sentry integration
module.exports = process.env.NODE_ENV === 'production'
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;