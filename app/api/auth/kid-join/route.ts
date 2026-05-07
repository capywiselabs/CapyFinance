import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';

const Body = z.object({
  familyCode: z.string().min(4).max(12),
  displayName: z.string().min(1).max(60),
  pin: z.string().regex(/^\d{4}$/),
});

/**
 * Look up the kid's auth user by (family_code, display_name) match — provisioned by parent —
 * and verify the PIN stored in profiles.user_metadata.kid_pin via service role, then issue a session.
 *
 * Note: in this MVP we accept any PIN match against the seed-time secret stored on the profile,
 * since under-13 users have no email. Production hardening: rate-limit by IP + family.
 */
export async function POST(req: Request) {
  const json = await req.json();
  const input = Body.parse(json);

  const service = createServiceRoleClient();

  const { data: family } = await service
    .from('families')
    .select('id')
    .eq('family_code', input.familyCode)
    .maybeSingle();
  if (!family) return new NextResponse('family_not_found', { status: 404 });

  const { data: members } = await service
    .from('family_members')
    .select('profile_id, profiles!inner(id, display_name, role)')
    .eq('family_id', family.id)
    .eq('relation', 'child');

  type ProfileRow = { id: string; display_name: string; role: string };
  const candidates = (members ?? [])
    .map((m) => {
      const p = m.profiles as unknown as ProfileRow | ProfileRow[] | null;
      return Array.isArray(p) ? p[0] : p;
    })
    .filter((p): p is ProfileRow => !!p && p.role === 'student');

  const matched = candidates.find(
    (p) => p.display_name.trim().toLowerCase() === input.displayName.trim().toLowerCase(),
  );
  if (!matched) return new NextResponse('kid_not_found', { status: 404 });

  // Read the kid's stored PIN from auth.users user_metadata (set during provisioning)
  const { data: userResp } = await service.auth.admin.getUserById(matched.id);
  const storedPin = (userResp?.user?.user_metadata as { kid_pin?: string } | undefined)?.kid_pin;
  if (!storedPin || storedPin !== input.pin) {
    return new NextResponse('bad_pin', { status: 401 });
  }

  // Generate a magic link, then exchange it for a session via the SSR client.
  const { data: linkData, error: linkErr } = await service.auth.admin.generateLink({
    type: 'magiclink',
    email: userResp?.user?.email ?? '',
  });
  if (linkErr || !linkData) {
    return new NextResponse('link_failed', { status: 500 });
  }

  const supabase = await createClient();
  const tokenHash = (linkData.properties as { hashed_token?: string } | undefined)?.hashed_token;
  if (!tokenHash) return new NextResponse('link_failed', { status: 500 });

  const { error: verifyErr } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: tokenHash,
  });
  if (verifyErr) return new NextResponse(verifyErr.message, { status: 500 });

  return NextResponse.json({ ok: true });
}
