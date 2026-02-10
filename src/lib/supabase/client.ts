import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  console.log('Creating browser client...', process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 10));
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
