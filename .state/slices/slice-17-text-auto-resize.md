# Slice 17: Text auto-resize

**Timestamp:** 2026-03-04
**Status:** Approved

---

## Plan

**Goal:** Fix text layer cut-off in FlyerEditor by replacing fixed single-line height with auto-resize behavior.

**Files:**
- `src/features/generate/FlyerEditor.tsx` — changed `height: layerFontSize(...)` to `minHeight: layerFontSize(...)`, added `useEffect([copy])` auto-resize and auto-resize in `onChange`
- `src/features/generate/FlyerEditor.test.tsx` — updated height test to check `minHeight`

**Outcome:** User can see all flyer copy text in the editor even when it wraps across multiple lines

**Verification:** `npm run verify` — 49/49 passing

---

## User Interactions

### Phase 4: Approval
```
User: ok, approve
```

---

## Build & Test Results

### Tests
```
Test Files  6 passed (6)
     Tests  49 passed (49)
```

**Status:** ✅ All Passing

**Test Details:**

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 1 | `FlyerEditor.test.tsx` | textarea min-height matches its font size | ✅ Pass | Textarea minHeight equals fontSize — floor is font size, text can grow beyond |

---

## Manual Verification Tasks

- [ ] Open any existing thread with a flyer — all 4 text layers show their full content without clipping
- [ ] Type a very long headline — the textarea grows to show all wrapped lines
- [ ] Drag, scrim toggle, regenerate, delete and download still work as before

---

## Summary

The Slice 16 textarea fix set a fixed `height` equal to the font size, which clipped any text that wrapped due to the 280px max-width. This slice replaces the fixed `height` with `minHeight` (keeping the font size as the floor) and adds `scrollHeight`-based auto-resize in both the `onChange` handler and a `useEffect` that runs whenever copy changes (covers initial load and item switches).
