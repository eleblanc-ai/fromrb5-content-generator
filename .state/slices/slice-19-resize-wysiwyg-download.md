# Slice 19: Resize + WYSIWYG download

**Timestamp:** 2026-03-04
**Status:** Approved

---

## Plan

**Goal**: Enable native textarea resize (both axes) and make canvas download text wrapping match the on-screen layout.

**Files:**
- `src/features/generate/FlyerEditor.tsx` — added `getWrappedLines` helper; rewrote `handleDownload` drawing loop using DOM-measured textarea width for WYSIWYG word-wrap; added `resize` Tailwind class to textarea; added `useEffect([item.id])` to set initial textarea width via DOM (not in React style prop so user drags persist)
- `src/features/generate/FlyerEditor.test.tsx` — 1 new test: textarea has `resize` class

**Outcome:** User can drag text boxes wider/narrower; downloaded PNG wraps text at the same width as the preview.

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

**Test Details:**

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 1 | `FlyerEditor.test.tsx` | textarea is resizable (resize class set to both axes) | ✅ Pass | `resize` class present, `resize-none` absent — both-axis native resize enabled |

---

## Manual Verification Tasks

- [ ] Drag the resize handle left or right — width changes and persists after release
- [ ] Type something after resizing — width does NOT reset
- [ ] Resize a textarea wider then download — PNG text wraps at the new width
- [ ] Switch threads — widths reset to 280px

---

## Summary

Two fixes in one slice. (1) **Textarea resize**: Tailwind's preflight sets `textarea { resize: vertical }` globally, so removing `resize-none` wasn't enough — adding the `resize` utility class explicitly sets `resize: both`. Width is managed DOM-only (not in the React `style` prop) via a `useEffect([item.id])` that sets `ta.style.width = '280px'` on mount and item switch; React never overwrites it during re-renders so user drags persist. (2) **WYSIWYG download**: `handleDownload` now reads each textarea's rendered pixel width from `getBoundingClientRect()`, scales it to 1080px canvas coordinates, and uses `getWrappedLines(ctx, text, canvasMaxWidth)` to match CSS word-wrap. Multi-line scrim pills now cover all wrapped lines.
