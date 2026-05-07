import 'server-only';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import type { Database } from './types';

let cached: ReturnType<typeof createServiceClient<Database>> | undefined;

export function createServiceRoleClient() {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for service-role client',
    );
  }
  cached = createServiceClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
