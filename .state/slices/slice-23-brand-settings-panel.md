# Slice 23: Brand Settings Panel

**Timestamp:** 2026-03-04 Z
**Status:** Approved

---

## Plan

**Goal:** Add a Brand Kit panel (accessible from the header) where the user can edit and save brand name, tagline, color palette, and font preference to `brand_settings`.

**Files:**
- `src/features/brand/BrandSettings.tsx` (create) — panel component with form
- `src/features/brand/index.ts` (create) — feature export
- `src/features/brand/BrandSettings.test.tsx` (create) — load, save, close, palette tests
- `src/app/App.tsx` (modify) — "Brand Kit" button in header + panel open/close state

**Outcome:** User can open Brand Kit from header, edit brand name/tagline/color palette/font preference, save, and settings persist across page refreshes.

**Verification:** `npm run verify`

---

## User Interactions

### Phase 2: Planning
```
Cosmo: Proposed Brand Settings Panel slice
User: ok
```

### Phase 4: Approval
```
User: ok
```

---

## Build & Test Results

### Tests

**Status:** ✅ All Passing — 69/69 (8 new)

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 1 | `BrandSettings.test.tsx` | renders brand settings loaded from Supabase | ✅ Pass | Brand name, tagline, font and color swatches restored from DB |
| 2 | `BrandSettings.test.tsx` | renders empty form when no brand settings exist | ✅ Pass | Empty fields and no color swatches when DB returns null |
| 3 | `BrandSettings.test.tsx` | calls update on save when settings already exist | ✅ Pass | `.update().eq('id', settingsId)` called with updated payload |
| 4 | `BrandSettings.test.tsx` | calls insert on save when no settings exist | ✅ Pass | `.insert()` called with form data when no existing row |
| 5 | `BrandSettings.test.tsx` | calls onClose when close button is clicked | ✅ Pass | ✕ button triggers onClose |
| 6 | `BrandSettings.test.tsx` | adds a color swatch when + Add color is clicked | ✅ Pass | New color swatch appears after clicking add |
| 7 | `BrandSettings.test.tsx` | removes a color swatch when Remove is clicked | ✅ Pass | Swatch removed from palette on Remove click |
| 8 | `BrandSettings.test.tsx` | hides + Add color button when palette has 5 colors | ✅ Pass | Add button hidden when palette is at max capacity |

---

## Manual Verification Tasks

- [ ] Click "Brand Kit" in the top-right header — panel slides in from the right
- [ ] Fill in brand name, tagline, font preference, add a color swatch — click Save
- [ ] Refresh the page, reopen Brand Kit — all values are restored
- [ ] Add/remove color swatches (max 5 — "Add color" disappears at 5)
- [ ] Click the backdrop or ✕ button — panel closes

**Expected Results:**
- All brand settings persist across page refreshes
- Color palette shows swatches with hex values displayed
- Panel overlays the app with a semi-transparent backdrop

---

## Summary

Added the Brand Kit panel accessible from the app header. The panel loads the singleton `brand_settings` row on open, lets the user edit brand name, tagline, color palette (up to 5 hex swatches), and font preference, and upserts the data to Supabase on save. The `brand_settings` table and TypeScript types were already in place from a prior migration slice, so this was a pure UI + persistence implementation. Logo upload is out of scope for this slice.
