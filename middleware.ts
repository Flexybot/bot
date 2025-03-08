import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const path = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/callback',
    '/blog',
    '/docs',
    '/features',
    '/pricing',
    '/contact',
    '/embed'
  ];

  // Static files and API routes should bypass middleware
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api/') ||
    path.includes('.') ||
    path.startsWith('/embed/')
  ) {
    return res;
  }

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    path === route || path.startsWith(`${route}/`)
  );

  // Validate required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    return res;
  }

  // Create Supabase client
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove: (name, options) => {
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  try {
    // Refresh session if expired
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Handle protected routes
    if (!isPublicRoute && !session) {
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirectTo', path);
      return NextResponse.redirect(redirectUrl);
    }

    // Handle legacy routes with NextResponse.redirect
    if (path === '/login') {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    if (path === '/signup') {
      return NextResponse.redirect(new URL('/auth/signup', request.url));
    }

    return res;
  } catch (error) {
    console.error('Error in middleware:', error);
    return res;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/|api/).*)',
  ],
};