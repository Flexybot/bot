import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  // In development, show a helpful error message
  if (process.env.NODE_ENV === 'development') {
    console.error(
      'Error: Supabase environment variables are missing. Please check your .env file and ensure the following variables are set:\n' +
      '- NEXT_PUBLIC_SUPABASE_URL\n' +
      '- SUPABASE_SERVICE_ROLE_KEY'
    );
  }
  throw new Error(
    'Supabase configuration is incomplete. Please check your environment variables.'
  );
}

export async function createServerSupabase() {
  return createServerComponentClient<Database>({ cookies });
}

// Admin client for server-side operations
export const adminSupabase = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);