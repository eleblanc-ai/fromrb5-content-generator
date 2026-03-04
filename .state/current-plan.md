## Slice 19: Resize + WYSIWYG download

**Goal**: Enable native textarea resize and make canvas download match on-screen text layout.

**Files:**
- `src/features/generate/FlyerEditor.tsx` — remove `resize-none`/`max-w-[280px]` from textarea className; add `width: '280px'` to inline style; add `getWrappedLines` helper; rewrite handleDownload drawing loop to use wrapped lines with DOM-measured max-width
- `src/features/generate/FlyerEditor.test.tsx` — 1 new test: textarea is resizable

**Outcome:** User can drag the resize handle on any text layer; downloaded PNG wraps text to match the on-screen layout.

**Verification:** `npm run verify`
