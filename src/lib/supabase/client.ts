import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('Creating browser client...', url?.slice(0, 10));

  if (!url || !key) {
    console.error('Supabase env vars missing');
    throw new Error('Supabase Configuration Missing');
  }

  // Basic JWT check
  if (!key.startsWith('ey')) {
    console.warn('WARNING: Supabase ANON KEY does not look like a JWT (should start with ey...)');
    // We continue but log it.
  }

  try {
    return createBrowserClient(url, key);
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    throw error;
  }
}
