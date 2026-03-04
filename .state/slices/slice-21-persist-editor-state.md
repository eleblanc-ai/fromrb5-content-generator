# Slice 21: Persist Editor State

**Timestamp:** 2026-03-04
**Status:** Approved

---

## Plan

**Goal**: Auto-save all editor customizations (layer positions, textarea widths, layer styles, scrim toggle, copy) to `content_items.text_output` so they survive page refresh and thread switching.

**Files:**
- `src/features/generate/FlyerEditor.tsx` — added `SavedLayer`, `EditorState` interfaces; extended `FlyerMetadata` with `editorState?`; debounced auto-save (`500ms`) to `content_items.text_output` whenever `layers`, `layerStyles`, `showScrim`, or `copy` change; restore all values on load from `metadata.editorState`; textarea widths restored from saved state in the DOM-only width effect
- `src/features/generate/FlyerEditor.test.tsx` — 4 new tests: restore positions, restore styles, restore scrim, auto-save on change

**Outcome:** Layer positions/widths, font/size/color per layer, scrim toggle, and edited copy all persist to Supabase and are restored when reopening a thread.

**Verification:** `npm run verify`

---

## User Interactions

### Phase 4: Approval
```
User: ok approve
```

---

## Build & Test Results

### Tests
```
Test Files  6 passed (6)
     Tests  61 passed (61)
```

**Status:** ✅ All Passing

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 1 | `FlyerEditor.test.tsx` | restores layer positions from saved editor state | ✅ Pass | Layers rendered at stored x/y on load |
| 2 | `FlyerEditor.test.tsx` | restores layer styles from saved editor state | ✅ Pass | Font family and color restored from editorState |
| 3 | `FlyerEditor.test.tsx` | restores scrim off state from saved editor state | ✅ Pass | showScrim: false restores scrim-off UI on load |
| 4 | `FlyerEditor.test.tsx` | auto-saves editor state when a layer style changes | ✅ Pass | Debounced update called with editorState JSON after 500ms |

---

## Summary

Extended `FlyerMetadata` (stored in `content_items.text_output`) with an `editorState` field containing layer positions, layer styles (fontSizeRem/fontFamily/color per layer), and scrim toggle. On item load, if `editorState` is present it restores all values; otherwise defaults apply. Textarea widths (DOM-only) are also restored from the saved `layers[].width` values. A debounced `useEffect` (500ms) auto-saves whenever any editable state changes, capturing textarea widths from the DOM at save time via `getBoundingClientRect()`. An `isInitializingRef` guard prevents a spurious save on mount or item switch.
