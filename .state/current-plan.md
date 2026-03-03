
# Current Plan

**Created:** 2026-03-03
**Last Updated:** 2026-03-03

---

## Original Goal

Pre-fill GenerateForm with sample data; generate structured copy blocks (headline, tagline, body, CTA) alongside each flyer variant via Claude; display them as editable fields on the result card; allow re-rendering with edited copy.

**Files:**
- `src/features/generate/GenerateForm.tsx` (modify) — update `INITIAL_FORM_VALUES` with realistic sample data
- `supabase/functions/generate-flyer/index.ts` (modify) — add Claude call to generate `FlyerCopyBlock`; embed copy in Gemini prompt; accept `copyOverride` to skip re-generation
- `src/shared/config/supabase.ts` (modify) — add `FlyerCopyBlock` type
- `src/features/generate/ResultCard.tsx` (modify) — parse copy from variant metadata; render editable copy fields; "Re-render with edits" button with `copyOverride`
- `src/features/generate/ResultCard.test.tsx` (modify) — tests for copy field rendering, editing, re-render payload
- `src/features/generate/GenerateForm.test.tsx` (modify) — update tests that reference empty initial values

**Outcome:** User opens app with pre-filled form, generates a flyer, sees editable copy fields, edits and re-renders.

**Verification:** `npm run verify` + manual copy-editing and re-render check.

---

## Iterations

### Iteration 1: Initial Slice 10 draft
**Date:** 2026-03-03
**User Feedback:** approved — added sample form values to scope

**Changes to scope:**
- Added GenerateForm pre-fill to in-scope
