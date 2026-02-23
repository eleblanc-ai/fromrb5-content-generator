# Slice 2: Supabase Setup

**Timestamp:** 2026-02-22 21:46:00
**Status:** Approved

---

## Plan

**Goal:** Connect to a hosted Supabase project, apply the `content_items` schema with RLS and Storage bucket policies, and wire up the typed frontend client.

**Files:**
- `supabase/config.toml` — from `supabase init`
- `supabase/migrations/20260223024445_create_content_items.sql` — enum + table + RLS + Storage bucket + policies
- `src/shared/config/supabase.ts` — typed Supabase client singleton + Database types
- `src/shared/config/supabase.test.ts` — client init tests

**Outcome:** Hosted Supabase has the required schema and Storage bucket. Frontend client initializes with typed schema access against cloud env vars. `npm run verify` stays green.

**Verification:** `npm run verify` (tsc + eslint + vitest)

---

## User Interactions

### Phase 2: Planning
```
Cosmo: Presented slice plan
User: yes (approved)
```

---

## Build & Test Results

### Tests
```
 RUN  v3.2.4

 ✓ src/shared/config/supabase.test.ts (2 tests) 2ms
 ✓ src/app/App.test.tsx (1 test) 23ms

 Test Files  2 passed (2)
      Tests  3 passed (3)
   Duration  961ms
```

**Status:** ✅ All Passing

**Test Details:**

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 1 | `src/app/App.test.tsx` | renders the app shell | ✅ Pass | App renders without crashing; "Content Studio" heading present in DOM |
| 2 | `src/shared/config/supabase.test.ts` | initializes without throwing | ✅ Pass | Supabase client created successfully with mocked env vars |
| 3 | `src/shared/config/supabase.test.ts` | exposes the expected supabase-js shape | ✅ Pass | Client has `.from()` function and `.storage` object |

---

## Manual Verification Tasks (Hosted Supabase)

- [ ] In Supabase dashboard, open **SQL Editor** and run the SQL from `supabase/migrations/20260223024445_create_content_items.sql`
- [ ] In Supabase dashboard, verify table `public.content_items` exists with columns: `id`, `type`, `prompt`, `text_output`, `image_url`, `parent_id`, `created_at`
- [ ] In Supabase dashboard, verify Storage bucket `content-images` exists and is public
- [ ] In project root `.env`, set `VITE_SUPABASE_URL` to your project URL and `VITE_SUPABASE_ANON_KEY` to your publishable (anon) key
- [ ] Run `npm run verify` and confirm all tests pass
- [ ] Run `npm run dev`, load the app, and confirm there are no Supabase env/config errors in the browser console

---

## Summary

Supabase project initialized. Migration creates the `content_type` enum, `content_items` table with all fields (including `parent_id` for image iteration chains), RLS enabled with anon full-access policy, and the `content-images` Storage bucket with anon read/upload policies. Typed frontend client singleton defined with `Database` interface matching the schema. All types exported for use in feature modules.
