# Slice 13: Thread Interactions

**Timestamp:** 2026-03-03 Z
**Status:** Approved

---

## Plan

**Goal:** Delete threads from sidebar; save interview history to DB; display message history in thread view; refinement chat input; resume in-progress interviews.

**Files:**
- `src/features/threads/ThreadSidebar.tsx` — per-thread delete button + `onDelete` prop
- `src/features/threads/ThreadView.tsx` — message history display on mount; refinement chat input
- `src/features/threads/ThreadView.test.tsx` (new) — history display, chat submission, generating state
- `src/features/generate/GenerateForm.tsx` — batch DB insert, resume props, multiline textarea, auto-resize
- `src/features/generate/GenerateForm.test.tsx` — batch insert + resume tests
- `src/shared/config/supabase.ts` — `refinementMessage?: string` on `FlyerGenerationRequest`
- `supabase/functions/generate-flyer/index.ts` — accept `refinementMessage`, inject into image prompt
- `src/app/App.tsx` — `handleDeleteThread`, `handleThreadStarted`, resume state, `threadsLoading` gate
- `src/app/App.test.tsx` — delete test + in-progress resume test

**Outcome:** User can delete threads, see full Q&A history, resume in-progress interviews, type refinements, and use a multiline auto-resizing textarea.

**Verification:** `npm run verify` — 39/39 pass

---

## User Interactions

### Phase 4: Approval
```
User: approved
```

---

## Build & Test Results

### Tests
**Status:** ✅ All Passing — 39/39

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 1 | `App.test.tsx` | removes thread from sidebar when delete confirmed | ✅ Pass | Delete → confirm → thread removed from DOM |
| 2 | `App.test.tsx` | shows GenerateForm when clicking an in-progress thread with no flyer | ✅ Pass | Thread with no flyer_item_id → GenerateForm with resume props |
| 3 | `ThreadView.test.tsx` | displays message history on mount | ✅ Pass | Messages from DB appear as chat bubbles |
| 4 | `ThreadView.test.tsx` | shows refinement input when item is present | ✅ Pass | Refinement textarea + button renders |
| 5 | `ThreadView.test.tsx` | hides refinement input when item is null | ✅ Pass | No refinement UI when no flyer |
| 6 | `ThreadView.test.tsx` | submits refinement and shows generating state | ✅ Pass | Submit calls generate-flyer with refinementMessage |
| 7 | `ThreadView.test.tsx` | does not show refinement input during generation | ✅ Pass | UI hides input while generating |
| 8 | `GenerateForm.test.tsx` | creates thread on first user message and notifies onThreadStarted | ✅ Pass | Thread created + onThreadStarted called on first submit |
| 9 | `GenerateForm.test.tsx` | restores conversation when resume props are provided without calling interview-flyer | ✅ Pass | Resume props restore messages; interview-flyer not called on mount |

---

## Manual Verification Tasks

- [x] App loads without errors
- [x] Open a completed thread — full Q&A history + flyer visible
- [x] Type a refinement message → submit → new flyer appears
- [x] Delete a thread from the sidebar — it disappears
- [x] Start an interview, abandon mid-way, refresh — thread persists; clicking it resumes
- [x] Click "New Flyer", then click back to an in-progress thread — conversation restores
- [x] Shift+Enter creates a new line; Enter submits
- [x] Textarea grows to fit content, caps + scrolls at ~160px

---

## Summary

Slice 13 added full thread lifecycle management: delete from sidebar, persistent interview history written to DB incrementally, history display on thread open, resume in-progress interviews, refinement chat, and a multiline auto-resizing textarea. Required 6 iterations to fix page-refresh regeneration, back-navigation restart, and the auto-resize feature.
