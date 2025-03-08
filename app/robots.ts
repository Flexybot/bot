import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://flexybot.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/features',
          '/pricing',
          '/docs',
          '/blog',
          '/contact',
          '/auth/login',
          '/auth/signup',
          '/privacy',
          '/terms',
        ],
        disallow: [
          '/dashboard/',
          '/admin/',
          '/api/',
          '/auth/callback',
          '/auth/setup',
          '/auth/reset-password',
          '/_next/',
          '/*.json$',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/'],
      },
      {
        userAgent: 'anthropic-ai',
        disallow: ['/'],
      },
      {
        userAgent: 'CCBot',
        disallow: ['/'],
      },
      {
        userAgent: 'Google-Extended',
        disallow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}