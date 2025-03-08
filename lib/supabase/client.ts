import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // In development, show a helpful error message
  if (process.env.NODE_ENV === 'development') {
    console.error(
      'Error: Supabase environment variables are missing. Please check your .env file and ensure the following variables are set:\n' +
      '- NEXT_PUBLIC_SUPABASE_URL\n' +
      '- NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }
  throw new Error(
    'Supabase configuration is incomplete. Please check your environment variables.'
  );
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
  }
);