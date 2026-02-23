# Slice 4: Image Generation

**Timestamp:** 2026-02-22 22:20:00
**Status:** Approved

---

## Plan

**Goal:** User can select "Image", type a prompt, and get a Gemini-generated image saved to Supabase Storage and displayed inline.

**Files:**
- `supabase/functions/generate-image/index.ts` (create) — calls Gemini with responseModalities: IMAGE, decodes base64 response, uploads to content-images Storage, saves image_url to content_items
- `src/features/generate/GenerateForm.tsx` (modify) — added image to AllContentType union + selector; routes to generate-image function when image selected
- `src/features/generate/GenerateForm.test.tsx` (modify) — added image option + generate-image routing tests
- `src/features/generate/ResultCard.tsx` (modify) — renders <img> when image_url is set
- `src/features/generate/ResultCard.test.tsx` (modify) — added image render and no-image-for-text tests

**Outcome:** User can generate images via Gemini. Images upload to Supabase Storage and display inline.

**Verification:** `npm run verify` + `supabase secrets set GEMINI_API_KEY` + `supabase functions deploy generate-image --no-verify-jwt`

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
 ✓ src/shared/config/supabase.test.ts  (2 tests)
 ✓ src/features/generate/ResultCard.test.tsx  (5 tests)
 ✓ src/app/App.test.tsx  (2 tests)
 ✓ src/features/generate/GenerateForm.test.tsx  (6 tests)

 Test Files  4 passed (4)
      Tests  15 passed (15)
   Duration  1.33s
```

**Status:** ✅ All Passing

**Test Details (new/modified in this slice):**

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 7 | `src/features/generate/GenerateForm.test.tsx` | shows all content types including image | ✅ Pass | All 4 options present including Image (updated from slice 3) |
| 9 | `src/features/generate/GenerateForm.test.tsx` | calls generate-text and fires onResult for text types | ✅ Pass | Text types still route to generate-text (renamed from slice 3) |
| 14 | `src/features/generate/GenerateForm.test.tsx` | calls generate-image when image type is selected | ✅ Pass | Selecting Image routes to generate-image function |
| 13 | `src/features/generate/ResultCard.test.tsx` | renders text output for text items | ✅ Pass | Text output shown for text items (renamed from slice 3) |
| 14 | `src/features/generate/ResultCard.test.tsx` | renders an image for image items | ✅ Pass | <img> rendered with correct src and alt when image_url set |
| 15 | `src/features/generate/ResultCard.test.tsx` | does not render an image for text items | ✅ Pass | No <img> element for text-only items |

---

## Manual Verification Tasks

- [ ] `supabase secrets set GEMINI_API_KEY=your-key-here`
- [ ] `supabase functions deploy generate-image --no-verify-jwt`
- [ ] `npm run dev` → select **Image** → type a prompt → click **Generate**
- [ ] Verify the generated image appears inline in the app
- [ ] In Supabase dashboard → Storage → `content-images`, confirm the image was uploaded
- [ ] In `content_items` table, confirm `type=image` row with a populated `image_url`

**Model name note:** The function uses `gemini-3-pro-image-preview` from the spec. If deployment fails with a model-not-found error, check available models in Google AI Studio and update `GEMINI_IMAGE_MODEL` in `supabase/functions/generate-image/index.ts`.

**Expected Results:**
- Image appears below the form after generation
- Storage bucket contains the uploaded image file
- `content_items` row has `image_url` pointing to the Storage file

---

## Summary

Added Gemini image generation end-to-end. The `generate-image` Edge Function uses `@google/genai` (the newer SDK), calls Gemini with `responseModalities: ['IMAGE']`, converts the base64 response to bytes, uploads to the `content-images` Storage bucket, and saves the public URL to `content_items`. The form now routes to the correct Edge Function based on content type. `ResultCard` renders images when `image_url` is present.
