# Slice 25: Logo upload + canvas overlay

**Timestamp:** 2026-03-04 Z
**Status:** Approved

---

## Plan

**Goal:** Add logo upload to Brand Kit panel and draw the logo in the bottom-right corner of the Mode B canvas on download.

**Files:**
- `src/features/brand/BrandSettings.tsx` — file input, Supabase Storage upload, thumbnail preview, Remove button
- `src/features/generate/FlyerEditor.tsx` — accept `logoUrl` prop, preview in editor, draw on canvas in download
- `src/features/threads/ThreadView.tsx` — thread `logoUrl` prop through to FlyerEditor
- `src/app/App.tsx` — fetch `brand_settings.logo_url` on mount and when Brand Kit closes; pass down to ThreadView
- `src/features/brand/BrandSettings.test.tsx` — 3 new tests: logo preview, remove, storage upload
- `src/features/generate/FlyerEditor.test.tsx` — 1 new test: logo shown via prop; cleaned up brand fetch mocks
- `src/app/App.test.tsx` — added brand_settings mock case

**Outcome:** User uploads a logo in Brand Kit; it appears in the bottom-right corner of the editor preview and is composited onto the downloaded PNG.

**Verification:** `npm run verify`

---

## Iterations

### Iteration 1: Initial implementation (internal fetch)
Logo URL fetched inside FlyerEditor on mount. Bug: if FlyerEditor was already mounted when Brand Kit saved, the logo wouldn't appear until navigating away and back.

### Iteration 2: Lift to App state
Moved `brandLogoUrl` state to App.tsx. Fetches on mount and re-fetches whenever Brand Kit panel closes (`showBrandKit` effect). Passes down as prop through ThreadView → FlyerEditor. Logo appears immediately after closing Brand Kit — no remount needed.

---

## User Interactions

### Phase 4: Approval
```
User: yes
```

---

## Build & Test Results

### Tests

**Status:** ✅ 73/73 passing

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 1 | `src/features/brand/BrandSettings.test.tsx` | shows logo preview image when logo_url is set | ✅ Pass | Logo img renders with correct src when brand settings include logo_url |
| 2 | `src/features/brand/BrandSettings.test.tsx` | clears logo preview when Remove logo is clicked | ✅ Pass | Remove button sets logoUrl to null, hiding the preview |
| 3 | `src/features/brand/BrandSettings.test.tsx` | calls Supabase Storage upload when logo file is selected | ✅ Pass | Storage upload called and publicUrl set as logo preview on file change |
| 4 | `src/features/generate/FlyerEditor.test.tsx` | shows brand logo in canvas preview when logoUrl prop is set | ✅ Pass | Logo img renders in canvas when logoUrl prop provided |

---

## Manual Verification Tasks

- [x] Upload logo in Brand Kit, click Save, close panel — logo appears in editor preview immediately
- [x] Download flyer — logo composited in bottom-right corner of the PNG
- [ ] Remove logo in Brand Kit, save — logo disappears from editor

---

## Summary

Added logo upload to the Brand Kit panel (uploads to Supabase Storage `content-images/logos/`, shows thumbnail preview with Remove button). Logo is rendered in the bottom-right corner of the Mode B flyer editor preview and composited onto the canvas during download (max 20% canvas width, 24px padding). Fixed a reactivity bug: logo URL is now held in App state and refetched whenever the Brand Kit panel closes, so it propagates immediately without requiring a page reload or navigation.
