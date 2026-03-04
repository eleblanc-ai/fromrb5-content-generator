# Slice 14: Design Editor

**Timestamp:** 2026-03-04 Z
**Status:** Awaiting Approval

---

## Plan

**Goal:** Replace the ResultCard flyer display with an interactive design editor: AI always returns a clean background image + structured copy, frontend renders draggable/editable text layers over the background, with "Regenerate art" and canvas-based download.

**Files:**
- `supabase/functions/interview-flyer/index.ts` — remove renderMode field; always output `"renderMode": "overlay"`
- `supabase/functions/generate-flyer/index.ts` — simplify `buildFlyerImagePrompt` to always generate background-only; remove ai_composed branch; fix call site
- `src/features/generate/FlyerEditor.tsx` (new) — background image + 4 draggable/editable text layers, Regenerate art, Download, Delete
- `src/features/generate/FlyerEditor.test.tsx` (new) — 11 tests covering render, editing, regenerate, delete, fallback
- `src/features/threads/ThreadView.tsx` — replace ResultCard import/usage with FlyerEditor
- `src/features/threads/ThreadView.test.tsx` — update mock from ResultCard to FlyerEditor
- `src/features/generate/index.ts` — remove ResultCard export, add FlyerEditor export
- `src/features/generate/ResultCard.tsx` (deleted)
- `src/features/generate/ResultCard.test.tsx` (deleted)

**Outcome:** Every new flyer shows a draggable design editor. User can reposition text layers, edit copy inline, regenerate the background art without re-running the interview, and download a composited PNG at full resolution.

**Verification:** `npm run verify` — 33/33 pass

---

## Build & Test Results

### Tests
**Status:** ✅ All Passing — 33/33

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 1 | `FlyerEditor.test.tsx` | renders the flyer canvas area | ✅ Pass | Canvas container present in DOM |
| 2 | `FlyerEditor.test.tsx` | renders the background image | ✅ Pass | `<img>` has correct background URL |
| 3 | `FlyerEditor.test.tsx` | shows 4 editable text layers with correct copy | ✅ Pass | All 4 textareas pre-populated from metadata |
| 4 | `FlyerEditor.test.tsx` | allows editing text layers | ✅ Pass | Typing changes textarea value |
| 5 | `FlyerEditor.test.tsx` | shows Regenerate art and Download buttons | ✅ Pass | Both action buttons present |
| 6 | `FlyerEditor.test.tsx` | calls generate-flyer with correct body when Regenerate art is clicked | ✅ Pass | Invokes generate-flyer with flyer brief + parentId |
| 7 | `FlyerEditor.test.tsx` | shows loading state while regenerating | ✅ Pass | Button shows "Generating..." and is disabled |
| 8 | `FlyerEditor.test.tsx` | shows an error when regenerate fails | ✅ Pass | Error message appears on failure |
| 9 | `FlyerEditor.test.tsx` | shows a delete button | ✅ Pass | Delete button present |
| 10 | `FlyerEditor.test.tsx` | calls supabase delete and onDeleted when Delete is clicked | ✅ Pass | Correct row deleted; onDeleted fires |
| 11 | `FlyerEditor.test.tsx` | shows fallback when item has no flyer data | ✅ Pass | "No flyer data available." message shown |

---

## Manual Verification Tasks

- [ ] Generate a new flyer — editor appears with background + 4 text layers
- [ ] Drag a text layer to a new position — it moves
- [ ] Edit text directly in a layer — value updates inline
- [ ] Click "Regenerate art" — background swaps without re-running interview
- [ ] Click "Download" — downloads composited PNG at 1080×1080
- [ ] Click "Delete" — thread/editor disappears

---

## Summary

Slice 14 replaced the ResultCard display with a FlyerEditor design editor. The AI interview and image generation backend were simplified to always produce a clean background (no more ai_composed/overlay branching). The frontend gained draggable text layers driven by percentage coordinates, inline textarea editing, regenerate-art without re-interviewing, and a Canvas 2D download that composites text onto the background at full resolution.
