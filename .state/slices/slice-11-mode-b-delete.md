# Slice 11: Mode B (Text Overlay) + Delete History

**Timestamp:** 2026-03-03
**Status:** Approved

---

## Plan

**Goal:** Implement Mode B (programmatic text overlay) and history item deletion.

**Files:**
- `supabase/functions/generate-flyer/index.ts` (modify) — overlay mode now sends background-only prompt to Gemini (no text/lettering)
- `src/features/generate/ResultCard.tsx` (modify) — canvas overlay rendering per variant; delete button with cascade variant cleanup
- `src/app/App.tsx` (modify) — pass onDeleted callback to ResultCard
- `src/features/generate/ResultCard.test.tsx` (modify) — delete + overlay tests
- `src/app/App.test.tsx` (modify) — delete from history test

**Outcome:** Overlay mode generates clean backgrounds and composites copy text client-side via Canvas 2D. Delete removes a card and all its variant rows from Supabase.

**Verification:** `npm run verify` + manual generation with Overlay mode + delete a card

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
 ✓ src/app/App.test.tsx (5 tests)
 ✓ src/features/generate/ResultCard.test.tsx (20 tests)
 ✓ src/features/generate/GenerateForm.test.tsx (6 tests)

 Test Files  4 passed (4)
      Tests  33 passed (33)
```

**Status:** ✅ All Passing

**Test Details (new/modified in this slice):**

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 35 | `src/features/generate/ResultCard.test.tsx` | shows a delete button on all card types | ✅ Pass | Delete button present on text, image, and flyer cards |
| 36 | `src/features/generate/ResultCard.test.tsx` | deletes all variant rows when delete is clicked on a flyer card | ✅ Pass | All variant IDs passed to supabase delete; onDeleted fires |
| 37 | `src/features/generate/ResultCard.test.tsx` | deletes single item when delete is clicked on a non-flyer card | ✅ Pass | Single ID deletion for non-variant items |
| 38 | `src/features/generate/ResultCard.test.tsx` | renders canvas elements for overlay-mode flyer cards | ✅ Pass | Canvas elements present in DOM for overlay renderMode |
| 39 | `src/app/App.test.tsx` | removes deleted item from history when onDeleted fires | ✅ Pass | Item removed from history list on delete callback |

---

## Summary

Mode B generates text-free backgrounds via Gemini (explicit no-text prompt) and composites the Claude-generated copy fields onto each background using the Canvas 2D API with system sans-serif, white text, and drop shadows. Layout constants are defined per format (instagram_post 1080×1080, instagram_story 1080×1920). Delete clears all variant rows from `content_items` in a single `.in()` call and removes the card from the history list.
