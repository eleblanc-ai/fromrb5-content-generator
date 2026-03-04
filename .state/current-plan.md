
# Current Plan

**Created:** 2026-03-03
**Last Updated:** 2026-03-03

---

## Original Goal

Slice 13: Thread Interactions — delete threads from sidebar, save interview history to DB, display message history in thread view, refinement chat input.

**Files:**
- `src/features/threads/ThreadSidebar.tsx` (modify) — add per-thread delete button + `onDelete` prop
- `src/features/threads/ThreadView.tsx` (modify) — load + display message history on mount; refinement chat input at bottom
- `src/features/threads/ThreadView.test.tsx` (create) — tests for history display, chat submission, generating state
- `src/features/generate/GenerateForm.tsx` (modify) — batch-insert interview history messages after thread creation
- `src/features/generate/GenerateForm.test.tsx` (modify) — assert interview messages batch-inserted
- `src/shared/config/supabase.ts` (modify) — add `refinementMessage?: string` to `FlyerGenerationRequest`
- `supabase/functions/generate-flyer/index.ts` (modify) — accept `refinementMessage`, inject into image prompt
- `src/app/App.tsx` (modify) — add `handleDeleteThread`, pass `onDelete` to sidebar, fix overflow for sticky chat input
- `src/app/App.test.tsx` (modify) — update ThreadSidebar mock + add sidebar delete test

**Outcome:** User can delete threads from sidebar; open an old thread and see full interview Q&A history; type a refinement and get a new flyer appended to the thread.

**Verification:** `npm run verify` + manual delete + history + refinement check.

---

## Iterations

### Iteration 6: Textarea auto-resize
**Date:** 2026-03-03
**User Feedback:** "make the text area autoresize so you can always see the entire prompt"

**Changes:**
- `GenerateForm.tsx`: Added `textareaRef`. Added `useEffect` watching `currentInput` that sets `el.style.height = 'auto'` then `el.style.height = scrollHeight + 'px'`. Attached `ref={textareaRef}` to `<textarea>`. Removed `rows={1}`. CSS `max-h-40 overflow-y-auto` caps growth at ~160px.

### Iteration 5: Fix back-navigation interview restart + multiline input
**Date:** 2026-03-03
**User Feedback:** "if i open the app it shows the existing convo but if i go to new flyer then go back it restarts" + "shift enter to create a new line"

**Root cause (back-navigation):** `setActiveThread(thread)` fired at the start of `loadThreadItem` (before any awaits). This changed the `key` on `GenerateForm` from `'new-thread'` to `thread.id` before `resumeThread`/`resumeMessages` were set. The fresh mount had no resume props → called `startInterview()`.

**Changes:**
- `App.tsx`: Moved `setActiveThread(thread)` to inside each branch (after all awaits), so it's batched with `viewMode`, `resumeThread`, and `resumeMessages` in the same React commit.
- `GenerateForm.tsx`: Changed `<input>` to `<textarea rows={1} max-h-40 resize-none>`. Added `onKeyDown` handler: `Enter` without `Shift` calls `handleSubmit`; `Shift+Enter` allows default newline. Added `items-end` on the flex container so button aligns to textarea bottom when it grows. Added `whitespace-pre-wrap` to message bubbles so multi-line messages render correctly.

### Iteration 4: Prevent interview regeneration on page refresh
**Date:** 2026-03-03
**User Feedback:** "when i refresh the conversation in a thread, it regenerates the chat"

**Root cause:** On page load `viewMode = 'new-thread'` (initial state), so `GenerateForm` mounted immediately and called `interview-flyer` before `loadThreads` finished. When `loadThreadItem` then found a completed thread and set `viewMode = 'thread'`, the interview call had already been fired. Secondary issue: switching between two in-progress threads reused the same `GenerateForm` instance (same `mountedRef`), showing stale messages from the first thread.

**Changes:**
- `App.tsx`: Added `threadsLoading: boolean` state (initially `true`). `loadThreadItem` calls `setThreadsLoading(false)` at the end. `loadThreads` calls `setThreadsLoading(false)` immediately when no threads exist. Render gates `GenerateForm` on `!threadsLoading`. Added `key={activeThread?.id ?? 'new-thread'}` to force remount when switching between threads.
- `App.test.tsx`: Updated "shows generate form when there are no threads" to include the Generate button assertion inside `waitFor` (so it waits for `threadsLoading` to clear).

### Iteration 3: Resume in-progress interview
**Date:** 2026-03-03
**User Feedback:** "not letting me continue the conversation if i leave and come back"

**Root cause:** `loadThreadItem` always set `viewMode = 'thread'`. When a thread had no `flyer_item_id`, `ThreadView` rendered with `item=null` showing "No output yet" — no way to continue the interview.

**Changes:**
- `App.tsx`: Added `resumeThread` and `resumeMessages` state. Updated `loadThreadItem` to detect in-progress threads (last assistant message has no `flyer_item_id`), query all messages, and set `viewMode = 'new-thread'` with resume props. `handleNewThread` and `handleResult` clear resume state. Resume props passed to `GenerateForm`.
- `GenerateForm.tsx`: Added optional `resumeThread?` and `resumeMessages?` props. On mount, if resume props provided: set `currentThread`, pre-populate `messages`/`history` from DB messages, set `interviewLoading=false` — skips `interview-flyer` API call.
- `App.test.tsx`: Added `mockMessagesAllOrder` mock for all-messages query. Updated `messages` mock to support `.eq().order()` chain. Updated delete test to mock a completed thread (so `ThreadView` renders). Added new test "shows GenerateForm when clicking an in-progress thread with no flyer".
- `GenerateForm.test.tsx`: Imported `Message` type. Added new test "restores conversation when resume props are provided without calling interview-flyer".

### Iteration 2: Fix mid-interview persistence
**Date:** 2026-03-03
**User Feedback:** "i started a conversation without finishing the interview, it should persist and it doesn't"

**Root cause:** Thread was only created inside `triggerGeneration` (called only on `complete: true`). Mid-interview abandons lost all history.

**Changes:**
- `GenerateForm.tsx`: Create thread on user's **first message** (not at generation time). Batch-insert `[opening Q, first user msg]` immediately. Insert each subsequent message pair incrementally as the interview progresses. `triggerGeneration` now takes `thread: Thread` instead of `capturedHistory`, and updates the thread title to `campaignGoal` when generation runs.
- `GenerateForm.test.tsx`: Added `mockThreadUpdate` mock. Added new test "creates thread on first user message and notifies onThreadStarted". Rewrote batch insert assertion to cover just the first exchange (opening Q + first answer). All renders now pass `onThreadStarted`.
- `App.tsx`: Added `handleThreadStarted(thread)` — prepends new in-progress thread to sidebar immediately. Passed `onThreadStarted={handleThreadStarted}` to `GenerateForm`.
- `App.test.tsx`: Updated GenerateForm mock type to include `onThreadStarted` param.

