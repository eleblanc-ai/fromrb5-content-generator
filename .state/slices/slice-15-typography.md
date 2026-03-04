# Slice 15: Typography Polish + Copy-Aware Composition

**Timestamp:** 2026-03-04 Z
**Status:** Approved

---

## Plan

**Goal:** Improve background image composition by passing actual copy zones to Gemini, and apply AI-driven Google Fonts typography to the design editor.

**Files:**
- `supabase/functions/generate-flyer/index.ts` (modify) — pass copy to buildFlyerImagePrompt; describe text zones
- `src/features/generate/typography.ts` (create) — getFlyerTypography(fontVibe) keyword-to-Google-Fonts mapping
- `src/features/generate/typography.test.ts` (create) — unit tests for font mapping
- `src/features/generate/FlyerEditor.tsx` (modify) — apply typography, load Google Fonts, update canvas download
- `src/features/generate/FlyerEditor.test.tsx` (modify) — typography assertions

**Outcome:** Gemini receives the actual copy content and reserves appropriate zones. Text layers render with brand-appropriate Google Fonts at a proper size hierarchy. Downloaded PNG uses the real typeface.

**Verification:** `npm run verify` — 44/44 pass

---

## User Interactions

### Phase 4: Approval
```
User: not bad! we need to fix how things are rendering but the basic connectivity is solid approve and let's build on what's coming out
```

---

## Build & Test Results

### Tests
**Status:** ✅ All Passing — 44/44

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 1 | `typography.test.ts` | returns Playfair Display + Lato for editorial vibes | ✅ Pass | Editorial keyword maps to correct pairing |
| 2 | `typography.test.ts` | returns Cormorant Garamond + Montserrat for elegant/luxury vibes | ✅ Pass | Luxury keyword maps to correct pairing |
| 3 | `typography.test.ts` | returns Oswald + Open Sans for bold/impact vibes | ✅ Pass | Bold keyword maps to correct pairing |
| 4 | `typography.test.ts` | returns Nunito for warm/friendly vibes | ✅ Pass | Friendly keyword maps to correct pairing |
| 5 | `typography.test.ts` | returns DM Sans default for unknown vibe | ✅ Pass | Unknown vibe falls back to DM Sans |
| 6 | `typography.test.ts` | has correct size hierarchy: headline > cta > tagline > body | ✅ Pass | Size ordering enforced |
| 7 | `typography.test.ts` | headline and cta have bold weight, body has regular weight | ✅ Pass | Weight hierarchy correct |
| 8 | `typography.test.ts` | includes both headline and body fonts in the URL | ✅ Pass | Google Fonts URL contains both families |
| 9 | `typography.test.ts` | deduplicates when headline and body font are the same | ✅ Pass | Single-font vibes produce one family in URL |
| 10 | `FlyerEditor.test.tsx` | applies larger font size to headline than body | ✅ Pass | Headline textarea has larger inline fontSize than body |
| 11 | `FlyerEditor.test.tsx` | applies the correct font family for editorial fontVibe | ✅ Pass | Headline uses Playfair Display for editorial vibe |

---

## Manual Verification Tasks

- [ ] Generate a flyer — text layers render with Google Fonts appropriate to the brand vibe
- [ ] Headline is visually larger than tagline > body
- [ ] "Click Download" — resulting PNG uses the correct font family at the right sizes
- [ ] Background image has clear zones where text will land

---

## Summary

Slice 15 added typography polish and copy-aware image composition. The `generate-flyer` prompt now includes the actual copy content with zone coordinates so Gemini can reserve appropriately-sized clear areas. FlyerEditor derives a Google Fonts pairing from `fontVibe` using a keyword matching table (5 pairings + default), dynamically injects the stylesheet, and applies per-layer font family, size, and weight. Canvas download waits for `document.fonts.ready` before compositing so the exported PNG uses the real typeface.
