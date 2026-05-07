# 悠學豚 CapyFinance

A gamified financial-literacy PWA for Hong Kong primary students aged 6–12.

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui — installable PWA
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions, RLS-first)
- **AI:** OpenAI `gpt-4o` (vision OCR), `gpt-4o-mini` (categorize), `whisper-1` (voice)
- **Analytics:** PostHog (reverse-proxied)
- **Email:** SendGrid (parent verification, approval requests, weekly reports)
- **Deploy:** Vercel (FE) + Supabase (BE)

## Modules

1. **Pet Companions** — Tamagotchi-style capybara linked to financial habits.
2. **Task System** — real chores (parent-approved) and virtual quizzes/videos → coin rewards.
3. **AI Expense Tracker** — Snap / Voice / Manual → OCR + NLU → auto-categorize → budget nudges.
4. **Financial Habit Report** — weekly AI-written summary for parents + analytics dashboard.

## Roles

- **Student** (under-13, no email) — joins via family code + PIN.
- **Parent** — Supabase Auth email + password.
- **Teacher** — class roster, curriculum mapping (HK EDB primary humanities).

## Local development

### Prerequisites
- Node 20+ and pnpm 9+
- Supabase CLI (`brew install supabase/tap/supabase` or `npm i -g supabase`)
- Docker (for `supabase start`)

### Setup

```bash
pnpm install
cp .env.example .env.local            # fill in keys

# Start local Supabase (Postgres, Auth, Storage, Edge Functions)
supabase start
supabase db reset                      # applies migrations + seeds

# Generate typed client
pnpm db:types

# Seed demo data
pnpm seed

# Run app
pnpm dev
```

Open <http://localhost:3000>.

### Demo accounts (after `pnpm seed`)
- Parent (Chan family): `parent.chan@demo.capy` / `Demo!1234`
- Parent (Wong family): `parent.wong@demo.capy` / `Demo!1234`
- Teacher: `teacher.lee@demo.capy` / `Demo!1234`
- Kid (Chan family): join at `/kid-join` with family code `CHAN01`, name `小耀`, PIN `1234`

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Production build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright E2E |
| `pnpm db:types` | Regenerate `lib/supabase/types.ts` from local DB |
| `pnpm db:reset` | Reset local DB and re-apply migrations + seeds |
| `pnpm seed` | Insert demo families/expenses/tasks |

## Architecture

See [`/root/.claude/plans/root-claude-uploads-eb804004-478b-4a43-validated-parrot.md`](../../root/.claude/plans/root-claude-uploads-eb804004-478b-4a43-validated-parrot.md) for the full plan.

Key invariants:
- All OpenAI calls live in `lib/openai/*` and are imported only from Route Handlers / Server Actions / Edge Functions (enforced via ESLint).
- `SUPABASE_SERVICE_ROLE_KEY` is **never** bundled — only `lib/supabase/service.ts` imports it, and that module is only reachable from server code.
- Coin/approval mutations go through `SECURITY DEFINER` Postgres functions so the client cannot mint coins by bypassing app logic.
- Under-13 students authenticate without an email address (PDPO-friendly data minimization).

## License

UNLICENSED — proprietary, all rights reserved.
