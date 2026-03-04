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

## Slice 14: Design Editor

Replaced the ResultCard flyer display with a FlyerEditor design editor. AI always returns a clean background image + structured copy. Frontend renders 4 draggable/editable text layers over the background, with "Regenerate art" (re-calls generate-flyer without re-interviewing) and Canvas 2D download at full resolution. ResultCard and its tests deleted; 33 tests total after removal.

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 1 | `FlyerEditor.test.tsx` | renders the flyer canvas area | ✅ Pass | Canvas container present in DOM |
| 2 | `FlyerEditor.test.tsx` | renders the background image | ✅ Pass | `<img>` has correct background URL |
| 3 | `FlyerEditor.test.tsx` | shows 4 editable text layers with correct copy | ✅ Pass | All 4 textareas pre-populated from metadata |
| 4 | `FlyerEditor.test.tsx` | allows editing text layers | ✅ Pass | Typing changes textarea value |
| 5 | `FlyerEditor.test.tsx` | shows Regenerate art and Download buttons | ✅ Pass | Both action buttons present |
| 6 | `FlyerEditor.test.tsx` | calls generate-flyer with correct body when Regenerate art is clicked | ✅ Pass | Invokes generate-flyer with flyer brief + parentId |
| 7 | `FlyerEditor.test.tsx` | shows loading state while regenerating | ✅ Pass | Button shows "Generating..." and is disabled |
| 8 | `FlyerEditor.test.tsx` | shows an error when regenerate fails | ✅ Pass | Error message appears on failure |
| 9 | `FlyerEditor.test.tsx` | shows a delete button | ✅ Pass | Delete button present |
| 10 | `FlyerEditor.test.tsx` | calls supabase delete and onDeleted when Delete is clicked | ✅ Pass | Correct row deleted; onDeleted fires |
| 11 | `FlyerEditor.test.tsx` | shows fallback when item has no flyer data | ✅ Pass | "No flyer data available." message shown |

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

## Slice 13: Thread Interactions

Full thread lifecycle: delete threads from sidebar, persist interview history to DB incrementally, display Q&A history on thread open, resume in-progress interviews without re-calling the AI, refinement chat input in ThreadView, and multiline auto-resizing textarea.

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 1 | `src/app/App.test.tsx` | removes thread from sidebar when delete confirmed | ✅ Pass | Delete → confirm → thread removed from DOM |
| 2 | `src/app/App.test.tsx` | shows GenerateForm when clicking an in-progress thread with no flyer | ✅ Pass | Thread with no flyer_item_id → GenerateForm with resume props |
| 3 | `src/features/threads/ThreadView.test.tsx` | displays message history on mount | ✅ Pass | Messages from DB appear as chat bubbles |
| 4 | `src/features/threads/ThreadView.test.tsx` | shows refinement input when item is present | ✅ Pass | Refinement textarea + button renders |
| 5 | `src/features/threads/ThreadView.test.tsx` | hides refinement input when item is null | ✅ Pass | No refinement UI when no flyer |
| 6 | `src/features/threads/ThreadView.test.tsx` | submits refinement and shows generating state | ✅ Pass | Submit calls generate-flyer with refinementMessage |
| 7 | `src/features/threads/ThreadView.test.tsx` | does not show refinement input during generation | ✅ Pass | UI hides input while generating |
| 8 | `src/features/generate/GenerateForm.test.tsx` | creates thread on first user message and notifies onThreadStarted | ✅ Pass | Thread created + onThreadStarted called on first submit |
| 9 | `src/features/generate/GenerateForm.test.tsx` | restores conversation when resume props are provided without calling interview-flyer | ✅ Pass | Resume props restore messages; interview-flyer not called on mount |

---

## Slice 15: Typography Polish + Copy-Aware Composition

Copy-aware Gemini prompt reserves clear zones for each text block using the actual copy. FlyerEditor applies Google Fonts pairings based on fontVibe keyword matching, injects the stylesheet dynamically, and uses the loaded typeface in canvas exports.

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

## Slice 16: Text Overlay Fix + Scrim Toggle + Stale Image Fix

Fixed text overlay not showing (textarea clipped at `rows={1}` height), added a toggleable semi-transparent scrim pill behind each text layer, and fixed stale image on refresh by updating `threads.flyer_item_id` in Supabase whenever a new item is generated via "Regenerate art" or refinement.

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 1 | `FlyerEditor.test.tsx` | shows the scrim toggle button | ✅ Pass | Toggle scrim button present in toolbar |
| 2 | `FlyerEditor.test.tsx` | scrim is on by default and shows filled indicator | ✅ Pass | Button label shows "Scrim ●" by default |
| 3 | `FlyerEditor.test.tsx` | toggling scrim off changes label and removes background from layers | ✅ Pass | Click removes background from layer wrappers; label changes to "Scrim ○" |
| 4 | `FlyerEditor.test.tsx` | textarea height matches its font size | ✅ Pass | Textarea height inline style equals its font size (no clipping) |
| 5 | `ThreadView.test.tsx` | updates thread flyer_item_id when FlyerEditor iterates | ✅ Pass | `threads.update({ flyer_item_id })` called with new item ID on iterate |

---

## Slice 17: Text auto-resize

Fixed text still getting cut off after Slice 16. The `height: layerFontSize(...)` fix capped textareas at one-line height — text wrapping due to the 280px max-width was silently clipped. Replaced with `minHeight` (font size as floor) and JS auto-resize via `scrollHeight` in both `onChange` and a `useEffect([copy])`.

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 1 | `FlyerEditor.test.tsx` | textarea min-height matches its font size | ✅ Pass | Textarea minHeight equals fontSize — text can grow beyond the floor |

---

## Slice 18: Per-layer style controls

Added per-layer style controls to the FlyerEditor toolbar. When a textarea is focused, the header bar shows the layer name, a font family dropdown (8 options), A−/A+ size buttons (±0.1rem, floor 0.5rem), and a free color picker. All 8 fonts are preloaded on mount to prevent serif fallback flash. Canvas download uses per-layer styles with proportional scaling.

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 1 | `FlyerEditor.test.tsx` | hides layer controls when no layer has been focused | ✅ Pass | Font/size/color controls absent until a textarea is focused |
| 2 | `FlyerEditor.test.tsx` | shows layer controls in toolbar when a textarea is focused | ✅ Pass | Font dropdown, A+/A−, and color picker appear after focus |
| 3 | `FlyerEditor.test.tsx` | clicking A+ increases the font size of the focused layer | ✅ Pass | A+ increments fontSizeRem by 0.1 |
| 4 | `FlyerEditor.test.tsx` | clicking A− decreases the font size of the focused layer | ✅ Pass | A− decrements fontSizeRem by 0.1 |
| 5 | `FlyerEditor.test.tsx` | font size does not go below 0.5rem | ✅ Pass | Floor enforced — repeated A− clicks can't go below 0.5 |
| 6 | `FlyerEditor.test.tsx` | changing the font dropdown updates the layer font family | ✅ Pass | Selecting Oswald updates textarea fontFamily to Oswald |
| 7 | `FlyerEditor.test.tsx` | changing the color input updates the layer text color | ✅ Pass | Color input change updates textarea color inline style |

---

## Slice 19: Resize + WYSIWYG download

Enabled native both-axis textarea resize (root cause: Tailwind preflight sets `resize: vertical` on all textareas; added the `resize` utility to override it). Width is managed DOM-only so React never resets it during re-renders. Download now reads each textarea's rendered pixel width from `getBoundingClientRect()`, scales to 1080px canvas, and uses `getWrappedLines` (`ctx.measureText`) to wrap text matching the preview.

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 1 | `FlyerEditor.test.tsx` | textarea is resizable (resize class set to both axes) | ✅ Pass | `resize` class present, `resize-none` absent — both-axis native resize enabled |

---
