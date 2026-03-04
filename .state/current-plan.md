
# Current Plan

**Created:** 2026-03-04
**Last Updated:** 2026-03-04

---

## Original Goal

Slice 14: Design Editor — replace static flyer display with interactive editor. AI always generates background; app renders editable/draggable text layers over it.

**Files:**
- `supabase/functions/interview-flyer/index.ts` (modify) — remove renderMode from system prompt; always output renderMode: 'overlay'
- `supabase/functions/generate-flyer/index.ts` (modify) — always use overlay path; remove ai_composed branch
- `src/features/generate/FlyerEditor.tsx` (create) — background + draggable/editable text layers, regenerate art, download
- `src/features/generate/FlyerEditor.test.tsx` (create) — renders text, editing, regenerate button
- `src/features/threads/ThreadView.tsx` (modify) — replace ResultCard with FlyerEditor
- `src/features/threads/ThreadView.test.tsx` (modify) — update for FlyerEditor mock
- `src/features/generate/ResultCard.tsx` (delete)
- `src/features/generate/ResultCard.test.tsx` (delete)
- `src/features/generate/index.ts` (modify) — remove ResultCard export

**Outcome:** User can edit text in place, drag blocks to reposition, regenerate background art, and download the composited result.

**Verification:** `npm run verify` passes

---

## Iterations

