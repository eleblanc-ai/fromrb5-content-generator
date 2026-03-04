# Current Plan

## Slice 16: Text Overlay Fix + Scrim Toggle + Stale Image Fix

### Problem
1. Overlay text not visible — textarea `rows={1}` constrained height to ~24px; text up to 2.6rem (~42px) was clipped by `overflow-hidden`
2. Stale image on refresh — `generate-flyer` creates a new child item but `threads.flyer_item_id` was never updated in the DB
3. Requested: toggleable scrim (semi-transparent pill behind each text layer) for legibility

### Solution

1. **Textarea height** — removed `rows={1}` and `overflow-hidden`, set `height: fontSize` + `lineHeight: 1` + `padding: 0` so each textarea is exactly one line at its font size — text renders at full size without clipping

2. **Scrim toggle** — `showScrim` state (default `true`), "Scrim ●/○" toggle button in toolbar; layer wrappers get `background: rgba(0,0,0,0.35)`, `borderRadius: 8px`, `padding: 2px 10px 2px 4px` when enabled; canvas download draws matching rounded rects via `ctx.roundRect()`

3. **Stale image fix** — added `handleItemChanged(newItem)` in `ThreadView` that calls `supabase.from('threads').update({ flyer_item_id: newItem.id }).eq('id', thread.id)` before forwarding to `onItemChanged`; used by both `onIterated` (Regenerate art) and `handleRefinement`

### Tests added
- `FlyerEditor.test.tsx`: scrim button present, default on, toggle off, textarea height matches font size
- `ThreadView.test.tsx`: `flyer_item_id` updated when FlyerEditor iterates

**Status: COMPLETE — 49/49 tests passing**
