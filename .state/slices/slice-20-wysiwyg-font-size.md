# Slice 20: WYSIWYG font size in download

**Timestamp:** 2026-03-04
**Status:** Approved

---

## Plan

**Goal**: Make downloaded PNG font sizes match the editor preview exactly.

**Files:**
- `src/features/generate/FlyerEditor.tsx` — removed `CANVAS_FONT_SIZES_POST`, `CANVAS_FONT_SIZES_STORY`, `defaultRems`; `handleDownload` now uses `parseFloat(getComputedStyle(ta).fontSize) * (1080 / containerWidth)` per layer

**Outcome:** Downloaded PNG font sizes are proportionally identical to what the user sees in the editor preview.

**Verification:** `npm run verify`

---

## User Interactions

### Phase 4: Approval
```
User: approve
```

---

## Build & Test Results

### Tests
```
Test Files  6 passed (6)
     Tests  57 passed (57)
```

**Status:** ✅ All Passing

No new tests — the download path runs in `img.onload` with `getComputedStyle` and canvas APIs unavailable in JSDOM.

---

## Manual Verification Tasks

- [ ] Open a flyer — text layers look the same relative to the background as before
- [ ] Click Download — font sizes in the PNG match what you see on screen
- [ ] Adjust font size with A+/A− then download — relative size is preserved
- [ ] Resize a text box wider then download — text wraps at the same width

---

## Summary

Replaced hardcoded `CANVAS_FONT_SIZES_POST/STORY` tables (which were calibrated for a fixed preview size) with a direct DOM measurement approach. At download time, `getComputedStyle(ta).fontSize` returns the textarea's actual rendered px font size (accounts for rem and any parent scaling). This is scaled by `1080 / containerWidth` to get the exact canvas pixel size that will appear proportionally identical to the preview. Removed the now-unused `CANVAS_FONT_SIZES_POST`, `CANVAS_FONT_SIZES_STORY` constants and the `defaultRems` computation.
