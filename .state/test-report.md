# Test Report

## Slice 1: Project Foundation

Established the React + Vite + TypeScript + Tailwind v4 project foundation including the full verification pipeline (tsc + eslint + vitest). This slice sets up the toolchain all future slices depend on and confirms the testing infrastructure works end-to-end.

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 1 | `src/app/App.test.tsx` | renders the app shell | ✅ Pass | App renders without crashing; "Content Studio" heading present in DOM |

---

## Slice 2: Supabase Setup

Initialized Supabase, created the `content_items` migration (enum + table + RLS + Storage bucket), and wired up the typed frontend client singleton. Tests verify the client initializes correctly against the schema types.

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 2 | `src/shared/config/supabase.test.ts` | initializes without throwing | ✅ Pass | Supabase client created successfully with mocked env vars |
| 3 | `src/shared/config/supabase.test.ts` | exposes the expected supabase-js shape | ✅ Pass | Client has `.from()` function and `.storage` object |

---

## Slice 3: Text Generation

First end-to-end feature. The `generate-text` Edge Function calls Claude with tea-brand system prompts, saves to `content_items`, and returns the saved record. The frontend form and result card handle loading, error, and display states.

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 4 | `src/app/App.test.tsx` | renders the app shell | ✅ Pass | App renders with supabase mocked; heading present |
| 5 | `src/app/App.test.tsx` | renders the generate form | ✅ Pass | GenerateForm is mounted and Generate button visible |
| 6 | `src/features/generate/GenerateForm.test.tsx` | renders content type selector, prompt textarea, and button | ✅ Pass | All 3 form elements render |
| 7 | `src/features/generate/GenerateForm.test.tsx` | disables submit when prompt is empty | ✅ Pass | Generate button disabled with empty prompt |
| 8 | `src/features/generate/GenerateForm.test.tsx` | calls generate-text and fires onResult for text types | ✅ Pass | Calls generate-text function with correct body, fires onResult callback |
| 9 | `src/features/generate/GenerateForm.test.tsx` | shows error message on failure | ✅ Pass | Displays error message when function call fails |
| 10 | `src/features/generate/ResultCard.test.tsx` | renders the content type label | ✅ Pass | Type label (e.g. "Tea writeup") displayed |
| 11 | `src/features/generate/ResultCard.test.tsx` | renders the prompt | ✅ Pass | User's original prompt shown on card |
| 12 | `src/features/generate/ResultCard.test.tsx` | renders text output for text items | ✅ Pass | Generated text output displayed on card |

---

## Slice 4: Image Generation

Added Gemini image generation. The `generate-image` Edge Function calls Gemini, uploads the image to Storage, and saves the public URL. The form routes to the correct function by type; `ResultCard` renders images when `image_url` is set.

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 13 | `src/features/generate/GenerateForm.test.tsx` | shows all content types including image | ✅ Pass | All 4 options present including Image |
| 14 | `src/features/generate/GenerateForm.test.tsx` | calls generate-image when image type is selected | ✅ Pass | Selecting Image routes to generate-image function |
| 15 | `src/features/generate/ResultCard.test.tsx` | renders an image for image items | ✅ Pass | `<img>` rendered with correct src and alt when image_url set |
| 16 | `src/features/generate/ResultCard.test.tsx` | does not render an image for text items | ✅ Pass | No `<img>` element for text-only items |

---

## Slice 5: Content History + Copy/Download

Added content history to the app shell and lightweight reuse actions on result cards. The app now loads previous `content_items` on start, prepends newly generated items, and exposes copy/download affordances by output type.

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 17 | `src/app/App.test.tsx` | loads and renders existing history items | ✅ Pass | Existing `content_items` are fetched and rendered in latest-first order |
| 18 | `src/app/App.test.tsx` | prepends newly generated items to history | ✅ Pass | New generated item appears at top of history list |
| 19 | `src/features/generate/ResultCard.test.tsx` | shows a copy action for text items only | ✅ Pass | Copy appears only for text outputs and download appears only for image outputs |
| 20 | `src/features/generate/ResultCard.test.tsx` | copies text output when copy is clicked | ✅ Pass | Click invokes clipboard write with generated text |
| 21 | `src/features/generate/ResultCard.test.tsx` | creates and clicks a download link for image items | ✅ Pass | Click triggers an anchor download for image output |

---

## Slice 6: Image Iteration

Added true image refinement behavior by conditioning Gemini on the original image bytes plus follow-up prompt. Iteration requests now carry `parentId` and `sourceImageUrl`, and the backend persists lineage while generating a related derivative image.

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 22 | `src/features/generate/ResultCard.test.tsx` | iterates an image with parentId and returns the new item | ✅ Pass | Iteration payload includes source image context and parent linkage metadata |

---

## Slice 1 (Rescope): Flyer Brief Scaffold

Replaced the generic generation form with a structured flyer brief scaffold and introduced typed request metadata for flyer format and render mode. This establishes the frontend contract for the flyer-focused rebuild.

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 23 | `src/features/generate/GenerateForm.test.tsx` | renders flyer brief fields, selectors, and submit button | ✅ Pass | Flyer brief scaffold UI renders |
| 24 | `src/features/generate/GenerateForm.test.tsx` | shows format and render mode options | ✅ Pass | Instagram Post/Story + AI composed/Overlay options exist |
| 25 | `src/features/generate/GenerateForm.test.tsx` | submits flyer payload and fires onResult | ✅ Pass | Structured flyer request payload is sent to function invoke |

---

## Slice 2 (Rescope): Actual Flyer Image Output

Added end-to-end flyer image output through a new `generate-flyer` edge function and frontend wiring. Deployment target was corrected to the active project so invoke requests succeed.

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 26 | `src/features/generate/GenerateForm.test.tsx` | submits flyer payload and fires onResult | ✅ Pass | Form invokes `generate-flyer` with structured flyer payload |
| 27 | `src/features/generate/ResultCard.test.tsx` | shows a copy action for text items only | ✅ Pass | Flyer image cards do not expose iterate-image controls |

---

## Slice 9: Export Package

Added a "Download all variants" button to flyer result cards. When clicked, it fetches all variant images, bundles them into a zip using JSZip, and triggers a browser download. The button only appears for multi-variant flyer cards; single-image items are unaffected.

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 28 | `src/features/generate/ResultCard.test.tsx` | renders download all variants button for multi-variant flyer cards | ✅ Pass | Button appears when flyerVariants.length > 1 |
| 29 | `src/features/generate/ResultCard.test.tsx` | does not render download all variants button for single-image items | ✅ Pass | Button absent for non-variant image items |
| 30 | `src/features/generate/ResultCard.test.tsx` | fetches all variants and triggers zip download on download all click | ✅ Pass | Fetches each variant URL, creates zip blob, triggers anchor download |

---

## Slice 10: Editable Copy Fields

Claude now generates a structured copy block (headline, tagline, body, CTA) for each flyer generation. The copy is stored in variant metadata and displayed as editable fields on the result card. Editing and clicking "Re-render with edits" re-invokes the Edge Function with `copyOverride`, skipping the Claude step and using the edited copy directly in the Gemini prompt. The form is pre-filled with sample values to avoid repetitive data entry during testing.

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 31 | `src/features/generate/GenerateForm.test.tsx` | enables submit when form is pre-filled | ✅ Pass | Button enabled with sample defaults present |
| 32 | `src/features/generate/GenerateForm.test.tsx` | disables submit when a required field is cleared | ✅ Pass | Button disabled when a required field is emptied |
| 33 | `src/features/generate/ResultCard.test.tsx` | renders editable copy fields for flyer cards with copy block | ✅ Pass | Headline/Tagline/Body/CTA inputs pre-populated from metadata |
| 34 | `src/features/generate/ResultCard.test.tsx` | invokes generate-flyer with copyOverride when re-render with edits is clicked | ✅ Pass | Edited copy sent as copyOverride in invoke payload |

---

## Slice 11: Mode B (Text Overlay) + Delete History

Mode B generates text-free backgrounds via Gemini and composites the copy fields onto each background using the Canvas 2D API with system sans-serif, white text, and drop shadows. Delete removes all variant rows for a flyer card (or a single row for other types) from Supabase and removes the card from the history list.

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 35 | `src/features/generate/ResultCard.test.tsx` | shows a delete button on all card types | ✅ Pass | Delete button present on text, image, and flyer cards |
| 36 | `src/features/generate/ResultCard.test.tsx` | deletes all variant rows when delete is clicked on a flyer card | ✅ Pass | All variant IDs passed to supabase delete; onDeleted fires |
| 37 | `src/features/generate/ResultCard.test.tsx` | deletes single item when delete is clicked on a non-flyer card | ✅ Pass | Single ID deletion for non-variant items |
| 38 | `src/features/generate/ResultCard.test.tsx` | renders canvas elements for overlay-mode flyer cards | ✅ Pass | Canvas elements present in DOM for overlay renderMode |
| 39 | `src/app/App.test.tsx` | removes deleted item from history when onDeleted fires | ✅ Pass | Item removed from history list on delete callback |

---

## Slice 12: Thread UI Skeleton

Replaced flat history list with a ChatGPT/Claude-style thread sidebar. Each brief creates a thread row + user/assistant messages in the DB. Two-column layout: ThreadSidebar + main panel (GenerateForm or ThreadView). Selecting a thread loads its latest flyer via content_items query.

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 40 | `src/app/App.test.tsx` | renders the app shell with header and sidebar | ✅ Pass | "Content Studio" heading + Flyer threads nav present |
| 41 | `src/app/App.test.tsx` | shows generate form when there are no threads | ✅ Pass | New-thread view rendered when thread list empty |
| 42 | `src/app/App.test.tsx` | loads threads on mount and shows them in sidebar | ✅ Pass | Threads fetched from Supabase; rendered in sidebar |
| 43 | `src/app/App.test.tsx` | shows generate form when new flyer button is clicked | ✅ Pass | handleNewThread switches back to new-thread view |
| 44 | `src/app/App.test.tsx` | adds a new thread to the sidebar and shows thread view when generation completes | ✅ Pass | onResult prepends new thread to sidebar; ThreadView shown |
| 45 | `src/app/App.test.tsx` | removes thread from sidebar when onThreadDeleted fires | ✅ Pass | handleThreadDeleted removes thread; generate form shown |

---

## Slice 13: Thread Interactions

Delete threads, save interview history to DB (early + incremental), display message history in thread view, refinement chat input, mid-interview persistence, and resume in-progress interviews.

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| — | `src/app/App.test.tsx` | renders the app shell with header and sidebar | ✅ Pass | Header + sidebar nav present |
| — | `src/app/App.test.tsx` | shows generate form when there are no threads | ✅ Pass | New-thread view rendered when thread list empty |
| — | `src/app/App.test.tsx` | loads threads on mount and shows them in sidebar | ✅ Pass | Threads rendered in sidebar |
| — | `src/app/App.test.tsx` | shows generate form when new flyer button is clicked | ✅ Pass | handleNewThread switches to new-thread view |
| — | `src/app/App.test.tsx` | adds a new thread to the sidebar and shows thread view when generation completes | ✅ Pass | onResult prepends thread; ThreadView shown |
| — | `src/app/App.test.tsx` | removes thread from sidebar when onThreadDeleted fires | ✅ Pass | handleThreadDeleted removes thread + shows generate form |
| — | `src/app/App.test.tsx` | shows GenerateForm when clicking an in-progress thread with no flyer | ✅ Pass | In-progress threads route to resume GenerateForm, not ThreadView |
| — | `src/features/generate/GenerateForm.test.tsx` | creates thread on first user message and notifies onThreadStarted | ✅ Pass | Thread created on first submit; sidebar updated immediately |
| — | `src/features/generate/GenerateForm.test.tsx` | restores conversation when resume props are provided without calling interview-flyer | ✅ Pass | Resumed messages displayed instantly; no API call on mount |
| — | `src/features/threads/ThreadView.test.tsx` | loads and displays message history on mount | ✅ Pass | Interview messages fetched and rendered as chat bubbles |
| — | `src/features/threads/ThreadView.test.tsx` | shows refinement input when item is present | ✅ Pass | Refinement chat input visible when flyer item loaded |
| — | `src/features/threads/ThreadView.test.tsx` | hides refinement input when item is null | ✅ Pass | No chat input shown for in-progress threads (before flyer) |
| — | `src/features/threads/ThreadView.test.tsx` | submits refinement and fires onItemChanged | ✅ Pass | Refinement invokes generate-flyer with refinementMessage + parentId |
| — | `src/features/threads/ThreadView.test.tsx` | shows generating state during refinement | ✅ Pass | "Generating..." shown while generate-flyer is pending |

---

## AI Interview + Typewriter

Replaced the scripted 10-step flyer brief form with an AI-driven conversational interview. `interview-flyer` edge function calls Claude with a JSON-mode system prompt; `GenerateForm` drives the chat turn-by-turn and auto-generates on `complete: true`. Added client-side typewriter animation and typing dots.

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| — | `src/features/generate/GenerateForm.test.tsx` | shows loading state while interview is starting | ✅ Pass | Input disabled while waiting for Claude's opening question |
| — | `src/features/generate/GenerateForm.test.tsx` | renders opening question after interview starts | ✅ Pass | Claude's first message appears as an assistant bubble |
| — | `src/features/generate/GenerateForm.test.tsx` | shows next question after user submits an answer | ✅ Pass | User bubble + Claude's follow-up both rendered |
| — | `src/features/generate/GenerateForm.test.tsx` | auto-generates and fires onResult when interview completes | ✅ Pass | `complete: true` triggers generate-flyer and fires onResult |
| — | `src/features/generate/GenerateForm.test.tsx` | shows generating state while flyer is being created | ✅ Pass | "Generating your flyer..." shown while function is pending |
| — | `src/features/generate/GenerateForm.test.tsx` | shows error message when interview call fails | ✅ Pass | Application-level error from `data.error` displayed |

---
