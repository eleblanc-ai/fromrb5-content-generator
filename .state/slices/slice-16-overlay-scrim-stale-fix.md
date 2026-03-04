# Slice 16: Text Overlay Fix + Scrim Toggle + Stale Image Fix

## Status: COMPLETE

## Changes

### `src/features/generate/FlyerEditor.tsx`
- Removed `rows={1}` + `overflow-hidden` from textarea; set `height`, `lineHeight: 1`, `padding: 0` inline styles so text renders at full font size without clipping
- Added `showScrim` state (default `true`) — semi-transparent pill background (`rgba(0,0,0,0.35)`) on each layer wrapper when enabled
- Added "Scrim ●/○" toggle button in toolbar
- Canvas download: draws `ctx.roundRect()` scrim behind each text block when `showScrim` is true; uses drop shadows instead when off

### `src/features/threads/ThreadView.tsx`
- Added `handleItemChanged(newItem)` — updates `threads.flyer_item_id` in Supabase before calling `onItemChanged`
- `onIterated` and `handleRefinement` both use `handleItemChanged`, ensuring refresh always shows the latest item

### `src/features/generate/FlyerEditor.test.tsx`
- Added: scrim button present, default on, toggle off, textarea height matches font size

### `src/features/threads/ThreadView.test.tsx`
- Added mock for `from('threads')` with `update().eq()` chain
- Updated FlyerEditor mock to expose `onIterated` callback
- Added test: `flyer_item_id` updated when FlyerEditor iterates

## Test result: 49/49 passing
