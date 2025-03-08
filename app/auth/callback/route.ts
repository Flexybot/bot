import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set(name, value, options);
          },
          remove(name, options) {
            cookieStore.set(name, '', options);
          },
        },
      }
    );
    
    try {
      await supabase.auth.exchangeCodeForSession(code);
      
      // Check if user has an organization
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .single();

      // If no organization, redirect to setup
      if (!orgMember) {
        return NextResponse.redirect(new URL('/auth/setup', request.url));
      }
      
      // Otherwise redirect to dashboard or specified next URL
      return NextResponse.redirect(new URL(next, request.url));
    } catch (error) {
      // If there's an error, redirect to login
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // If no code, redirect to home page
  return NextResponse.redirect(new URL('/', request.url));
}