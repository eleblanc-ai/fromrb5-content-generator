# Slice 6: Image Iteration

**Timestamp:** 2026-03-01 13:37:31
**Status:** Approved

---

## Plan

**Goal:** User can refine an existing generated image with follow-up instructions; each new image is linked to its source via `parent_id`.

**Files:**
- `supabase/functions/generate-image/index.ts` (modify) — accepts `parentId` and `sourceImageUrl`, fetches source image bytes, sends source image + prompt to Gemini, stores `parent_id`
- `src/features/generate/ResultCard.tsx` (modify) — adds image-only iteration form and submits to `generate-image` with `parentId` and `sourceImageUrl`
- `src/app/App.tsx` (modify) — handles `onIterated` callback so new iterations prepend into history
- `src/features/generate/ResultCard.test.tsx` (modify) — verifies iteration UI and invoke payload includes `parentId` + `sourceImageUrl`

**Outcome:** Image iterations are true refinements of the selected source image (not unrelated fresh generations), and lineage is persisted in Supabase.

**Verification:** `npm run verify` + `supabase functions deploy generate-image --no-verify-jwt`

---

## User Interactions

### Phase 2: Planning
```
Cosmo: Presented slice plan
User: yes (approved)
```

### Phase 4: Approval
```
User: initial rejection after manual test (iteration looked unrelated)
Cosmo: implemented source-image conditioning fix and redeployed function
User: approved
```

---

## Build & Test Results

### Tests
```
 ✓ src/shared/config/supabase.test.ts (2 tests) 3ms
 ✓ src/app/App.test.tsx (4 tests) 219ms
 ✓ src/features/generate/ResultCard.test.tsx (9 tests) 359ms
 ✓ src/features/generate/GenerateForm.test.tsx (6 tests) 517ms

 Test Files  4 passed (4)
      Tests  21 passed (21)
   Duration  1.96s
```

**Status:** ✅ All Passing

**Test Details (new/modified in this slice):**

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 22 | `src/features/generate/ResultCard.test.tsx` | iterates an image with parentId and returns the new item | ✅ Pass | Iteration invoke payload includes `prompt`, `type=image`, `parentId`, and `sourceImageUrl`; callback receives returned item |

---

## Manual Verification Tasks

- [x] Run `npm run verify`
- [x] Deploy updated function: `supabase functions deploy generate-image --no-verify-jwt`
- [x] Generate an image, iterate with follow-up prompt, verify result is visually related to source image
- [x] Confirm new row has `parent_id` set to original image `id`

**Expected Results:**
- Iterated image reflects original composition/style with requested changes
- New history item appears at top
- `content_items.parent_id` is populated for iterations

---

## Summary

Implemented end-to-end image iteration with actual source-image conditioning. The first implementation only linked rows in DB; after manual feedback, the function was corrected to include source image bytes in Gemini input, then redeployed. Iterations now behave as true refinements and are tracked in history with parent linkage.
