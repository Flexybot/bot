// For static export, we'll use a simpler middleware
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
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
    return NextResponse.next();
  }

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    path === route || path.startsWith(`${route}/`)
  );

  // Handle legacy routes with NextResponse.redirect
  if (path === '/login') {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  if (path === '/signup') {
    return NextResponse.redirect(new URL('/auth/signup', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/|api/).*)',
  ],
};