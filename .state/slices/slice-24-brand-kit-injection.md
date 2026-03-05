# Slice 24: Brand kit injection into generation

**Timestamp:** 2026-03-04 Z
**Status:** Approved

---

## Plan

**Goal:** Auto-inject brand name, tagline, and color palette into every `generate-flyer` call by fetching `brand_settings` server-side in the edge function.

**Files:**
- `supabase/functions/generate-flyer/index.ts` (modify) — added BrandContext interface, hexToColorDescription helper, moved Supabase client creation earlier, fetch brand settings, inject into generateCopyBlock and buildFlyerImagePrompt

**Outcome:** Every generated flyer reflects the saved brand name, tagline, and color palette automatically.

**Verification:** `npm run verify` + deploy + manual test

---

## Iterations

### Iteration 1: Initial implementation
**User Feedback:** "I don't see the colors reflected, I regenerated an existing flyer"

**Changes to scope:**
- Added `hexToColorDescription()` HSL converter — hex codes alone aren't understood by Gemini; needed descriptive names like "deep purple (#7c3aed)"
- Updated brand palette line to use descriptive names + hex

### Iteration 2: Fix prompt ordering
**User Feedback:** "It's not reflected, seems like whatever is in the prompt may be overriding"

**Changes to scope:**
- Restructured `buildFlyerImagePrompt`: when brand colors are set, they become `PRIMARY COLOR PALETTE` directive placed before everything else
- `Color vibe` demoted to `Mood/atmosphere reference (secondary only)` when brand colors exist

### Iteration 3: Deploy to remote
**User Feedback:** "It's clearly not working"

**Root cause:** Edge function changes were only local. App connects to remote Supabase — function was never deployed.

**Changes to scope:**
- `supabase functions deploy generate-flyer`

---

## User Interactions

### Phase 2: Planning
```
Cosmo: Proposed brand kit injection slice
User: ok
```

### Phase 4: Approval
```
User: worked!
```

---

## Build & Test Results

### Tests

**Status:** N/A — edge function has no unit tests (Deno runtime)

**69/69 frontend tests passing throughout.**

---

## Manual Verification Tasks

- [x] Set brand colors in Brand Kit panel
- [x] Regenerate a flyer — brand colors are reflected in the generated image
- [ ] Generate a fresh flyer — brand name/tagline appear in copy

**Expected Results:**
- Generated image uses brand palette as dominant colors
- Copy uses brand name and tagline as context

---

## Summary

Fetches `brand_settings` server-side on every edge function call and injects brand name/tagline into the Claude copy prompt and brand color palette into the Gemini image prompt. Added `hexToColorDescription()` to convert hex values to natural-language color descriptions Gemini can understand. Fixed prompt ordering so brand colors take priority over the flyer brief's `colorVibe`. Root cause of delayed fix: function changes were local-only and needed `supabase functions deploy` to take effect on the remote instance the app uses.
