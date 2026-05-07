/* eslint-disable no-console */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/supabase/types';

// Demo passwords (DEV ONLY — do not use in production):
//   Parent (Chan):  parent.chan@demo.capy / Demo!1234
//   Parent (Wong):  parent.wong@demo.capy / Demo!1234
//   Teacher:        teacher.lee@demo.capy / Demo!1234

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
}
const sb = createClient<Database>(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PASSWORD = 'Demo!1234';

async function ensureUser(email: string, role: 'parent' | 'teacher', displayName: string) {
  const { data: list } = await sb.auth.admin.listUsers({ perPage: 200 });
  const existing = list.users.find((u) => u.email === email);
  let userId = existing?.id;
  if (!userId) {
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { role, display_name: displayName },
    });
    if (error) throw error;
    userId = data.user!.id;
  }
  await sb
    .from('profiles')
    .upsert({ id: userId, role, display_name: displayName, locale: 'zh-HK' });
  return userId;
}

async function ensureKid(displayName: string, pin: string) {
  const email = `kid_${displayName.toLowerCase().replace(/\W/g, '')}@kids.capyfinance.local`;
  const { data: list } = await sb.auth.admin.listUsers({ perPage: 200 });
  const existing = list.users.find((u) => u.email === email);
  let userId = existing?.id;
  if (!userId) {
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: { kid_pin: pin, role: 'student' },
    });
    if (error) throw error;
    userId = data.user!.id;
  } else {
    await sb.auth.admin.updateUserById(userId, { user_metadata: { kid_pin: pin, role: 'student' } });
  }
  await sb
    .from('profiles')
    .upsert({ id: userId, role: 'student', display_name: displayName, locale: 'zh-HK' });
  await sb.from('pets').upsert({ student_id: userId });
  return userId;
}

async function ensureFamily(parentIds: string[], kidIds: string[], code: string, name: string) {
  const { data: existing } = await sb
    .from('families')
    .select('id')
    .eq('family_code', code)
    .maybeSingle();
  let familyId = existing?.id;
  if (!familyId) {
    const { data, error } = await sb
      .from('families')
      .insert({ family_code: code, name, created_by: parentIds[0] ?? null })
      .select('id')
      .single();
    if (error) throw error;
    familyId = data.id;
  }
  for (const pid of parentIds) {
    await sb
      .from('family_members')
      .upsert({ family_id: familyId, profile_id: pid, relation: 'parent' });
  }
  for (const kid of kidIds) {
    await sb
      .from('family_members')
      .upsert({ family_id: familyId, profile_id: kid, relation: 'child' });
  }
  return familyId;
}

async function seedExpenses(studentId: string, count: number) {
  const { data: cats } = await sb.from('categories').select('id, slug');
  const slugMap = new Map((cats ?? []).map((c) => [c.slug, c.id]));
  const samples: Array<{ merchant: string; slug: string; max: number }> = [
    { merchant: 'ParknShop', slug: 'groceries', max: 9000 },
    { merchant: '7-Eleven', slug: 'snacks', max: 4000 },
    { merchant: 'MTR', slug: 'transport', max: 2500 },
    { merchant: 'McDonald\'s', slug: 'food', max: 6000 },
    { merchant: 'Watsons', slug: 'health', max: 5000 },
  ];
  for (let i = 0; i < count; i++) {
    const sample = samples[i % samples.length]!;
    const days = Math.floor(Math.random() * 14);
    const occurred = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    await sb.from('expenses').insert({
      student_id: studentId,
      amount_cents: 500 + Math.floor(Math.random() * sample.max),
      currency: 'HKD',
      merchant_text: sample.merchant,
      category_id: slugMap.get(sample.slug) ?? null,
      occurred_at: occurred,
      source: 'manual',
      status: 'confirmed',
    });
  }
}

async function main() {
  console.log('— Seeding demo data —');

  const parentChan = await ensureUser('parent.chan@demo.capy', 'parent', '陳爸爸');
  const parentWong = await ensureUser('parent.wong@demo.capy', 'parent', 'Wong媽');
  const teacher = await ensureUser('teacher.lee@demo.capy', 'teacher', 'Lee 老師');

  const chanYiu = await ensureKid('小耀', '1234');
  const chanMan = await ensureKid('阿文', '1234');
  const wongKit = await ensureKid('Kit', '1234');

  await ensureFamily([parentChan], [chanYiu, chanMan], 'CHAN01', 'Chan Family');
  await ensureFamily([parentWong], [wongKit], 'WONG01', 'Wong Family');

  // Class
  const { data: school } = await sb
    .from('schools')
    .upsert({ name: 'Demo Primary School', district: 'Kwun Tong' })
    .select('id')
    .single();
  const { data: cls } = await sb
    .from('classes')
    .upsert({ school_id: school!.id, name: '4A', grade: 4, year: 2026 })
    .select('id')
    .single();
  await sb.from('teacher_classes').upsert({ teacher_profile_id: teacher, class_id: cls!.id });
  for (const sid of [chanYiu, chanMan, wongKit]) {
    await sb
      .from('class_enrollments')
      .upsert({ class_id: cls!.id, student_profile_id: sid });
  }

  for (const kid of [chanYiu, chanMan, wongKit]) {
    await seedExpenses(kid, 20);
    const { data: snacksCat } = await sb
      .from('categories')
      .select('id')
      .eq('slug', 'snacks')
      .single();
    if (snacksCat) {
      await sb.from('budgets').upsert(
        {
          student_id: kid,
          category_id: snacksCat.id,
          period: 'monthly',
          limit_cents: 30000,
          active: true,
        },
        { onConflict: 'id' },
      );
    }
  }

  console.log('— Seed complete —');
  console.log('Demo accounts:');
  console.log('  parent.chan@demo.capy / Demo!1234');
  console.log('  parent.wong@demo.capy / Demo!1234');
  console.log('  teacher.lee@demo.capy / Demo!1234');
  console.log('Kids: family code CHAN01 names 小耀/阿文 PIN 1234, family code WONG01 name Kit PIN 1234');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
