# Slice 3: Text Generation

**Timestamp:** 2026-02-22 22:07:00
**Status:** Approved

---

## Plan

**Goal:** User can type a prompt, select a text content type, and generate real Claude text that's saved to Supabase and displayed inline.

**Files:**
- `supabase/functions/generate-text/index.ts` (create) — Deno Edge Function: validates input, calls claude-sonnet-4-5 with tea-brand system prompts, saves to content_items, returns saved record
- `src/features/generate/GenerateForm.tsx` (create) — prompt textarea, content type selector (text types only), generate button, loading state
- `src/features/generate/GenerateForm.test.tsx` (create) — render, submit, loading, error tests
- `src/features/generate/ResultCard.tsx` (create) — displays generated text with type label and prompt
- `src/features/generate/ResultCard.test.tsx` (create) — render tests
- `src/features/generate/index.ts` (create) — public feature API
- `src/app/App.tsx` (modify) — mounts GenerateForm + ResultCard, holds result state
- `src/app/App.test.tsx` (modify) — mocks supabase module, adds form render test

**Outcome:** User can type a prompt, click Generate, and see generated tea business content appear in the app, saved to Supabase.

**Verification:** `npm run verify` + deploy Edge Function + set ANTHROPIC_API_KEY secret

---

## User Interactions

### Phase 2: Planning
```
Cosmo: Presented slice plan
User: yes (approved)
```

### Phase 4: Approval
```
User: yes (approved)
```

---

## Build & Test Results

### Tests
```
 ✓ src/shared/config/supabase.test.ts  (2 tests) 2ms
 ✓ src/features/generate/ResultCard.test.tsx  (3 tests) 33ms
 ✓ src/app/App.test.tsx  (2 tests) 77ms
 ✓ src/features/generate/GenerateForm.test.tsx  (5 tests) 242ms

 Test Files  4 passed (4)
      Tests  12 passed (12)
   Duration  1.20s
```

**Status:** ✅ All Passing

**Test Details:**

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 4 | `src/app/App.test.tsx` | renders the app shell | ✅ Pass | App renders with supabase mocked; heading present |
| 5 | `src/app/App.test.tsx` | renders the generate form | ✅ Pass | GenerateForm is mounted and Generate button visible |
| 6 | `src/features/generate/GenerateForm.test.tsx` | renders content type selector, prompt textarea, and button | ✅ Pass | All 3 form elements render |
| 7 | `src/features/generate/GenerateForm.test.tsx` | shows all text content types | ✅ Pass | Flyer copy, Tea writeup, Communication options present |
| 8 | `src/features/generate/GenerateForm.test.tsx` | disables submit when prompt is empty | ✅ Pass | Generate button disabled with empty prompt |
| 9 | `src/features/generate/GenerateForm.test.tsx` | calls functions.invoke and fires onResult on success | ✅ Pass | Calls generate-text function with correct body, fires onResult callback |
| 10 | `src/features/generate/GenerateForm.test.tsx` | shows error message on failure | ✅ Pass | Displays error message when function call fails |
| 11 | `src/features/generate/ResultCard.test.tsx` | renders the content type label | ✅ Pass | Type label (e.g. "Tea writeup") displayed |
| 12 | `src/features/generate/ResultCard.test.tsx` | renders the prompt | ✅ Pass | User's original prompt shown on card |
| 13 | `src/features/generate/ResultCard.test.tsx` | renders the text output | ✅ Pass | Generated text output displayed on card |

---

## Manual Verification Tasks

- [ ] Set Anthropic API key as a Supabase secret: `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`
- [ ] Deploy Edge Function: `supabase functions deploy generate-text --no-verify-jwt`
- [ ] Run `npm run dev` and open the app
- [ ] Type a prompt (e.g. "Write a product description for a smoky lapsang souchong"), select **Tea writeup**, click **Generate**
- [ ] Verify generated text appears below the form
- [ ] In Supabase dashboard → Table Editor → `content_items`, confirm the row was saved with prompt and generated text

**Expected Results:**
- The form submits and shows "Generating..." while waiting
- Generated tea copy appears in a card below the form
- A new row exists in `content_items` with the correct type, prompt, and text_output

---

## Summary

First end-to-end feature: users can generate real AI content. The `generate-text` Edge Function calls Claude with type-specific tea brand system prompts (one per content type), saves the result to `content_items`, and returns the saved record. The frontend form handles loading and error states. Image generation is out of scope for this slice — the content type selector only shows the three text types.
