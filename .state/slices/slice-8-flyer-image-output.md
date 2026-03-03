# Slice 2 (Rescope): Actual Flyer Image Output

**Timestamp:** 2026-03-01 14:34:57
**Status:** Approved

---

## Plan

**Goal:** Deliver real flyer image output in-app from the flyer brief flow.

**Files:**
- `supabase/functions/generate-flyer/index.ts` (create) — accepts flyer payload, generates image with Gemini, uploads to Storage, saves `content_items` row
- `src/features/generate/GenerateForm.tsx` (modify) — invokes `generate-flyer`
- `src/features/generate/ResultCard.tsx` (modify) — restricts image iteration controls to `type=image` records
- `src/features/generate/GenerateForm.test.tsx` (modify) — expects `generate-flyer` invocation
- `src/features/generate/ResultCard.test.tsx` (modify) — ensures flyer image cards do not show iterate controls

**Outcome:** Submitting flyer brief now returns and displays an actual generated flyer image.

**Verification:** `npm run verify` + deploy function + manual generation check

---

## User Interactions

### Phase 2: Planning
```
Cosmo: Presented Slice 2 plan
User: approved
```

### Phase 4: Approval
```
User: initially hit edge-function request failure
Cosmo: diagnosed wrong Supabase project target and redeployed generate-flyer to wyuckckjmmxdjhqaprop
User: looks good (approved)
```

---

## Build & Test Results

### Tests
```
 ✓ src/shared/config/supabase.test.ts (2 tests) 6ms
 ✓ src/app/App.test.tsx (4 tests) 188ms
 ✓ src/features/generate/ResultCard.test.tsx (9 tests) 327ms
 ✓ src/features/generate/GenerateForm.test.tsx (5 tests) 1388ms

 Test Files  4 passed (4)
      Tests  20 passed (20)
   Duration  2.80s
```

**Status:** ✅ All Passing

**Test Details (new/modified in this slice):**

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 26 | `src/features/generate/GenerateForm.test.tsx` | submits flyer payload and fires onResult | ✅ Pass | Form invokes `generate-flyer` with structured flyer payload |
| 27 | `src/features/generate/ResultCard.test.tsx` | shows a copy action for text items only | ✅ Pass | Flyer image cards can download/copy but do not show image-iteration controls |

---

## Manual Verification Tasks

- [x] Deploy `generate-flyer` to project `wyuckckjmmxdjhqaprop`
- [x] Confirm function appears in deployed list
- [x] Submit flyer brief and confirm response succeeds

**Expected Results:**
- Edge Function request succeeds
- Result card displays generated flyer image

---

## Summary

Introduced real flyer image generation via a dedicated edge function and fixed deployment target mismatch so production requests resolve correctly.
