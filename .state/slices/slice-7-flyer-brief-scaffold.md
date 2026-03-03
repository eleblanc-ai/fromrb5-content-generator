# Slice 1 (Rescope): Flyer Brief Scaffold

**Timestamp:** 2026-03-01 14:05:47
**Status:** Approved

---

## Plan

**Goal:** Replace the generic prompt flow with a structured flyer brief form and typed payload contract for flyer-focused generation.

**Files:**
- `src/features/generate/GenerateForm.tsx` (modify) — switched to full flyer brief fields, format selector, render mode selector, and structured request payload
- `src/features/generate/GenerateForm.test.tsx` (modify) — updated tests for required brief fields, options, and payload shape
- `src/shared/config/supabase.ts` (modify) — added `FlyerFormat`, `FlyerRenderMode`, and `FlyerGenerationRequest` types

**Outcome:** User can submit a complete flyer brief and the frontend sends a stable flyer-specific payload contract.

**Verification:** `npm run verify`

---

## User Interactions

### Phase 2: Planning
```
Cosmo: Presented Slice 1 plan
User: yup (approved)
```

### Phase 4: Approval
```
User: "a result but not the result we're looking for"
User: approved Slice 1 and asked to move to Slice 2
```

---

## Build & Test Results

### Tests
```
 ✓ src/shared/config/supabase.test.ts (2 tests) 3ms
 ✓ src/app/App.test.tsx (4 tests) 248ms
 ✓ src/features/generate/ResultCard.test.tsx (9 tests) 398ms
 ✓ src/features/generate/GenerateForm.test.tsx (5 tests) 1487ms

 Test Files  4 passed (4)
      Tests  20 passed (20)
   Duration  3.16s
```

**Status:** ✅ All Passing

**Test Details (new/modified in this slice):**

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 23 | `src/features/generate/GenerateForm.test.tsx` | renders flyer brief fields, selectors, and submit button | ✅ Pass | New flyer-focused form scaffold renders correctly |
| 24 | `src/features/generate/GenerateForm.test.tsx` | shows format and render mode options | ✅ Pass | Instagram Post/Story and AI composed/Overlay options are present |
| 25 | `src/features/generate/GenerateForm.test.tsx` | submits flyer payload and fires onResult | ✅ Pass | Frontend emits typed flyer request payload contract |

---

## Manual Verification Tasks

- [x] Run `npm run verify`
- [ ] Run `npm run dev`
- [ ] Fill all flyer brief fields and submit
- [ ] Confirm request body includes `flyer` object with `format` + `renderMode`

**Expected Results:**
- Form validates required brief fields
- Submit triggers generation request with structured flyer payload

---

## Summary

Established the flyer-specific UX contract and payload shape. This slice intentionally stops short of final flyer image rendering, which is planned next.
