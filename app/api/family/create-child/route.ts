import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';

const Body = z.object({
  displayName: z.string().min(1).max(60),
  pin: z.string().regex(/^\d{4}$/),
});

function randomFamilyCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

export async function POST(req: Request) {
  const json = await req.json();
  const { displayName, pin } = Body.parse(json);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse('not_authenticated', { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || profile.role !== 'parent') {
    return new NextResponse('not_parent', { status: 403 });
  }

  const service = createServiceRoleClient();

  // ensure family exists
  const { data: existing } = await service
    .from('family_members')
    .select('family_id, families(id, family_code)')
    .eq('profile_id', user.id)
    .eq('relation', 'parent')
    .limit(1)
    .maybeSingle();

  let familyId: string | null = null;
  let familyCode: string | null = null;
  if (existing) {
    const f = existing.families as unknown as { id: string; family_code: string } | null;
    familyId = f?.id ?? null;
    familyCode = f?.family_code ?? null;
  }

  if (!familyId) {
    const code = randomFamilyCode();
    const { data: family } = await service
      .from('families')
      .insert({ family_code: code, created_by: user.id, name: `${profile.display_name}'s family` })
      .select('id, family_code')
      .single();
    familyId = family!.id;
    familyCode = family!.family_code;
    await service
      .from('family_members')
      .insert({ family_id: familyId, profile_id: user.id, relation: 'parent' });
  }

  // provision the kid auth user
  const kidUuidEmail = `kid_${crypto.randomUUID()}@kids.capyfinance.local`;
  const password = crypto.randomUUID();
  const { data: created, error: createErr } = await service.auth.admin.createUser({
    email: kidUuidEmail,
    password,
    email_confirm: true,
    user_metadata: { kid_pin: pin, role: 'student' },
  });
  if (createErr || !created.user) {
    return new NextResponse(createErr?.message ?? 'create_user_failed', { status: 500 });
  }

  await service.from('profiles').upsert({
    id: created.user.id,
    role: 'student',
    display_name: displayName,
    locale: 'zh-HK',
  });
  await service
    .from('family_members')
    .insert({ family_id: familyId, profile_id: created.user.id, relation: 'child' });
  await service.from('pets').upsert({ student_id: created.user.id });

  return NextResponse.json({ displayName, familyCode });
}
