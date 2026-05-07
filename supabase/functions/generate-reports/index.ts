// Weekly cron: generate AI-written habit reports for each active student.
// Stub — Phase 4 implementation. Validates the cron secret today.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';

Deno.serve(async (req: Request) => {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ') || auth.slice(7) !== Deno.env.get('CRON_SECRET')) {
    return new Response('forbidden', { status: 403 });
  }
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Phase 4 will:
  //   1. find active students (expenses in last 14d)
  //   2. aggregate metrics
  //   3. call OpenAI gpt-4o-mini with parent-tone system prompt
  //   4. insert into reports table
  //   5. SendGrid notification to linked parent
  void supabase;
  return Response.json({ status: 'stub' });
});
