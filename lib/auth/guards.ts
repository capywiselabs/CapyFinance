import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/supabase/types';

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');
  return user;
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('profiles')
    .select('id, role, display_name, avatar_url, locale')
    .eq('id', user.id)
    .maybeSingle();
  return data;
}

export async function requireRole(role: UserRole | UserRole[]) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/sign-in');
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(profile.role)) redirect('/forbidden');
  return profile;
}

export function homeForRole(role: UserRole): string {
  switch (role) {
    case 'student':
      return '/expenses';
    case 'parent':
      return '/dashboard';
    case 'teacher':
      return '/classes';
    default:
      return '/';
  }
}
