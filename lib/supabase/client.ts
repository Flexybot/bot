import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('Missing required Supabase environment variables');
  throw new Error('Missing required Supabase environment variables');
}

// Create client-side Supabase client
export const supabase = createBrowserClient<Database>(
  supabaseUrl!,
  supabaseAnonKey!
);