// Permissive types until `pnpm db:types` runs against a live Supabase project.
// To regenerate from the actual DB:
//   supabase gen types typescript --local > lib/supabase/types.ts
//
// We re-export Database as a loose type so supabase-js calls don't get
// inferred as `never`. Once the real generated file replaces this, the
// strong types come back automatically.

/* eslint-disable @typescript-eslint/no-explicit-any */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'student' | 'parent' | 'teacher' | 'school_admin';
export type TaskKind = 'real' | 'virtual_video' | 'virtual_quiz';
export type TaskStatus =
  | 'draft'
  | 'active'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'expired';
export type ExpenseSource = 'photo' | 'voice' | 'manual' | 'imported';
export type ExpenseStatus = 'pending_review' | 'confirmed' | 'rejected';
export type CurrencyCode = 'HKD' | 'CNY' | 'USD';
export type ReportPeriod = 'weekly' | 'monthly' | 'term';
export type ShopItemKind = 'hat' | 'shirt' | 'accessory' | 'background' | 'material';

export type Database = any;
