# Slice 12: Thread UI Skeleton

**Timestamp:** 2026-03-03
**Status:** Approved

---

## Plan

**Goal:** Replace flat history list with thread sidebar + thread detail area. Brief form creates a thread; selecting a thread shows its latest flyer. Sidebar lists all threads.

**Files:**
- `supabase/migrations/20260303180000_add_threads_messages_brand_settings.sql` (new) — `threads`, `messages`, `brand_settings` tables + RLS policies
- `src/shared/config/supabase.ts` (modify) — add `Thread`, `Message`, `BrandSettings` types; expand `Database` with Views/Functions/Relationships to satisfy supabase-js 2.49 `GenericSchema`
- `src/app/App.tsx` (rewrite) — two-column layout: ThreadSidebar + main panel (GenerateForm or ThreadView)
- `src/features/threads/ThreadSidebar.tsx` (new) — thread list, active highlight, new thread button, relative date
- `src/features/threads/ThreadView.tsx` (new) — shows active thread's latest flyer via ResultCard; fires onThreadDeleted
- `src/features/threads/index.ts` (new) — barrel export
- `src/features/generate/GenerateForm.tsx` (modify) — `onResult` now `(thread, item)`; creates thread row + user/assistant messages on submit
- `src/app/App.test.tsx` (rewrite) — 6 tests for two-column thread model
- `src/features/generate/GenerateForm.test.tsx` (modify) — thread/message mocks; updated onResult assertion

**Outcome:** Two-column layout. Brief submission creates thread → appears in sidebar → selected thread shows flyer in main panel.

**Verification:** `npm run verify` + manual: create two threads, switch between them in sidebar

---

## User Interactions

### Phase 2: Planning
```
User: approved
```

### Phase 4: Approval
```
User: approved
```

---

## Build & Test Results

### Tests
```
 ✓ src/shared/config/supabase.test.ts (2 tests)
 ✓ src/app/App.test.tsx (6 tests)
 ✓ src/features/generate/ResultCard.test.tsx (20 tests)
 ✓ src/features/generate/GenerateForm.test.tsx (6 tests)

 Test Files  4 passed (4)
      Tests  34 passed (34)
```

**Status:** ✅ All Passing

**Test Details (new/modified in this slice):**

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|--------------------|
| 40 | `src/app/App.test.tsx` | renders the app shell with header and sidebar | ✅ Pass | "Content Studio" heading + Flyer threads nav present |
| 41 | `src/app/App.test.tsx` | shows generate form when there are no threads | ✅ Pass | New-thread view rendered when thread list empty |
| 42 | `src/app/App.test.tsx` | loads threads on mount and shows them in sidebar | ✅ Pass | Threads fetched from Supabase; rendered in sidebar |
| 43 | `src/app/App.test.tsx` | shows generate form when new flyer button is clicked | ✅ Pass | handleNewThread switches back to new-thread view |
| 44 | `src/app/App.test.tsx` | adds a new thread to the sidebar and shows thread view when generation completes | ✅ Pass | onResult prepends new thread to sidebar; ThreadView shown |
| 45 | `src/app/App.test.tsx` | removes thread from sidebar when onThreadDeleted fires | ✅ Pass | handleThreadDeleted removes thread; generate form shown |

---

## Summary

Replaced the flat history list with a ChatGPT/Claude-style thread sidebar. Each flyer brief now creates a `threads` row on submission, along with `user` and `assistant` message rows in the `messages` table. The app shell uses a two-column layout: `ThreadSidebar` on the left lists all threads with active highlight and relative timestamps; the main panel shows either the `GenerateForm` (new-thread mode) or `ThreadView` (thread mode) for the selected thread.

**TypeScript note:** supabase-js 2.49 requires the `Database` generic to satisfy `GenericSchema` (which requires `Views`, `Functions`, and per-table `Relationships`). Named interfaces without an index signature don't satisfy `Record<string, unknown>`, collapsing inferred types to `never`. Used targeted `(supabase as any)` casts at 5 callsites with explicit return type annotations as the pragmatic fix.
