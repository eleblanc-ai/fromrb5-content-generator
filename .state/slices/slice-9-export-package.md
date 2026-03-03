# Slice 9: Export Package

**Timestamp:** 2026-03-03 13:25:00
**Status:** Approved

---

## Plan

**Goal:** Add a "Download all variants" button that zips all 3 flyer variants and downloads them in one click.

**Files:**
- `package.json` (modify) — added `jszip` ^3.10.1 (deps) + `@types/jszip` ^3.4.0 (devDeps)
- `src/features/generate/ResultCard.tsx` (modify) — imported JSZip, added `downloadingAll`/`downloadAllError` state, added `handleDownloadAllVariants` function, added "Download all variants" button visible when `flyerVariants.length > 1`
- `src/features/generate/ResultCard.test.tsx` (modify) — 3 new tests for download all variants behavior

**Outcome:** User can download all 3 generated flyer variants as a single zip file with one click.

**Verification:** `npm run verify` + manual variant zip download check.

---

## User Interactions

### Phase 2: Planning
```
Cosmo: Presented Slice 9 plan (export package)
User: approve
```

### Phase 4: Approval
```
User: approve
```

---

## Build & Test Results

### Tests
```
 ✓ src/shared/config/supabase.test.ts (2 tests) 2ms
 ✓ src/app/App.test.tsx (4 tests) 162ms
 ✓ src/features/generate/ResultCard.test.tsx (14 tests) 383ms
 ✓ src/features/generate/GenerateForm.test.tsx (5 tests) 1280ms

 Test Files  4 passed (4)
      Tests  25 passed (25)
   Duration  2.10s
```

**Status:** ✅ All Passing

**Test Details (new/modified in this slice):**

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 28 | `src/features/generate/ResultCard.test.tsx` | renders download all variants button for multi-variant flyer cards | ✅ Pass | Button appears when flyerVariants.length > 1 |
| 29 | `src/features/generate/ResultCard.test.tsx` | does not render download all variants button for single-image items | ✅ Pass | Button absent for non-variant image items |
| 30 | `src/features/generate/ResultCard.test.tsx` | fetches all variants and triggers zip download on download all click | ✅ Pass | Fetches each variant URL, creates zip blob, triggers anchor download |

---

## Manual Verification Tasks

- [ ] Run `npm run dev` + `supabase start`
- [ ] Submit a flyer brief and wait for 3 variants to generate
- [ ] Confirm "Download all variants" button appears below the Download button
- [ ] Click "Download all variants" — confirm browser downloads a `.zip` file
- [ ] Unzip the file and confirm it contains 3 image files (`flyer-variant-1.png`, `flyer-variant-2.png`, `flyer-variant-3.png`)
- [ ] Confirm "Download" (selected variant only) still works independently

**Expected Results:**
- Zip downloads with all 3 variant images
- Single-image items (non-flyer) show no "Download all variants" button

---

## Summary

Added export package functionality using JSZip. When a flyer card has multiple variants, a "Download all variants" button appears that fetches each variant image, bundles them into a zip, and triggers a browser download. Single-image items are unaffected.
