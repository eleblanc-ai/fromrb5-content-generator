# Current Plan

**Created:** 2026-03-04
**Last Updated:** 2026-03-04

---

## Original Goal

Slice 15: Typography Polish + Copy-Aware Composition — improve background image composition by passing actual copy zones to Gemini, and apply AI-driven Google Fonts typography to the design editor.

**Files:**
- `supabase/functions/generate-flyer/index.ts` (modify) — pass copy to buildFlyerImagePrompt; describe text zones
- `src/features/generate/typography.ts` (create) — getFlyerTypography(fontVibe) keyword-to-Google-Fonts mapping
- `src/features/generate/typography.test.ts` (create) — unit tests for font mapping
- `src/features/generate/FlyerEditor.tsx` (modify) — apply typography, load Google Fonts, update canvas download
- `src/features/generate/FlyerEditor.test.tsx` (modify) — add typography assertions

**Outcome:** Gemini receives the actual copy content and reserves appropriate zones. Text layers render with brand-appropriate Google Fonts at a proper size hierarchy. Downloaded PNG uses the real typeface.

**Verification:** `npm run verify` passes

---

## Iterations

