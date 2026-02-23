# Cosmo Behavior Checklist

Use this to verify Cosmo is behaving as specified. Each item is a discrete, observable behavior.

> **Maintenance:** This checklist mirrors `cosmo-instructions/workflow.md`. Any change to workflow.md must be reflected here in the same commit.

---

## Startup & Resume

- [ ] On new conversation: `cosmo.md` is auto-loaded by Claude Code — Cosmo identity is active

**On Start:**
- [ ] Runs `curl -s https://raw.githubusercontent.com/eleblanc-ai/cosmo/master/VERSION` and uses the actual output — does not guess or fabricate the remote version
- [ ] If curl fails or returns empty: tells the user version check failed and continues with local version
- [ ] If versions differ: tells the user the current and latest version, asks "Update now? (yes/no)"
- [ ] If update accepted: downloads and extracts new `cosmo-instructions/`, copies `VERSION`, commits the update, continues startup
- [ ] If update declined or versions match: continues startup normally
- [ ] Reads `workflow.md` completely before doing anything
- [ ] Checks `.state/current-phase.md`
- [ ] If `current-phase.md` exists: resumes from the correct phase without re-asking questions already answered
- [ ] If `current-phase.md` is empty or missing: starts from Phase 2 (assumes spec is done)
- [ ] Does not re-present an already-approved plan on resume

---

## Communication

- [ ] Every response starts with the current phase indicator (`📋 Phase 2`, `🔨 Phase 3`, `✅ Phase 4`, etc.)
- [ ] Routing question appears only when presenting the phase deliverable (completed spec / completed plan / completed slice)
- [ ] Routing question is NOT appended to intermediate responses (interview questions, clarifications, tangent answers)
- [ ] Can answer questions and have natural conversation without leaving the current phase
- [ ] After any tangent, returns to the current phase and continues from where it left off

---

## Phase 2: Plan

- [ ] Reads required files in order before planning (architecture.md → stack file → spec.md → slices → codebase)
- [ ] If all spec features are complete: asks what to work on next before planning
- [ ] Plan includes all required elements: goal, why now, scope, user-visible outcome, file map, tests, verification, risks
- [ ] In-scope and out-of-scope are explicitly stated
- [ ] Does not write any code or modify any files during planning
- [ ] Does not proceed to Phase 3 without explicit user approval
- [ ] On approval: writes plan to `.state/current-plan.md`
- [ ] On approval: writes Phase 3 breadcrumb to `.state/current-phase.md` ("Implementing slice N: [name], plan approved.")

---

## Phase 3: Implement

- [ ] Only implements what is in the approved plan — nothing more
- [ ] Does not refactor, optimize, or clean up code outside the plan
- [ ] Does not add features, abstractions, or config not in the plan
- [ ] Does not remove or break any functionality outside the slice scope
- [ ] If existing code must change to accommodate the slice, applies tiered judgment:
  - Additive changes (new param with default, new export, new optional field): makes the change and notes it in Phase 4 summary
  - Behavioral changes (alters existing logic, return values, or side effects): stops and flags before proceeding
  - Breaking changes (removes/renames param, alters interface or contract): hard stop, does not proceed without explicit user approval
- [ ] Adds or updates tests for all new or changed behavior
- [ ] Never removes existing tests (unless explicitly in the plan)
- [ ] Runs the verification command and fixes all failures before proceeding
- [ ] Does not proceed to Phase 4 while any check is failing
- [ ] On verification pass: updates `.state/current-phase.md` to Phase 4 breadcrumb ("Slice N implemented, awaiting approval.")
- [ ] Auto-proceeds to Phase 4 after verification passes (no user prompt needed)

---

## Phase 4: Approval

- [ ] Presents the full slice: actual test output, actual file list, actual verify output — no summaries
- [ ] Manual verification checklist appears directly in the chat (not in a file)
- [ ] Schema/migration changes (if any) appear directly in the chat
- [ ] Asks "Approve this slice? (yes/no)"
- [ ] On approval:
  - [ ] Writes slice file to `.state/slices/slice-{N}-{name}.md`
  - [ ] Appends entry to `.state/test-report.md`
  - [ ] Clears `.state/current-plan.md` and `.state/current-phase.md`
  - [ ] If GitHub integration enabled: runs `git add -A && git commit && git push`
  - [ ] Tells the user: "Committed and pushed: {commit message}"
  - [ ] Proceeds to Phase 2
- [ ] Slice file is NEVER written before approval
- [ ] On rejection: asks what needs to change, updates plan, returns to Phase 3, presents full updated slice before re-asking for approval

---

## State Management

- [ ] `current-phase.md` is updated automatically at Phase 2→3 and Phase 3→4 transitions
- [ ] `current-phase.md` is only cleared on Phase 4 approval (or user request)
- [ ] `current-phase.md` is also saved when user asks to pause/stop
- [ ] Resuming from a Phase 3 breadcrumb re-reads the approved plan and continues implementation
- [ ] Resuming from a Phase 4 breadcrumb re-presents the slice for approval

---

## Scope & Quality

- [ ] Diff at the end of a slice is minimal — only files in the approved plan are modified
- [ ] No unused imports, exports, or dead code introduced by the slice
- [ ] All new functionality has tests
- [ ] All existing tests still pass after the slice
- [ ] Architecture boundaries respected (no feature-to-feature imports, correct folder placement)
- [ ] No secrets committed

---

## GitHub Integration

- [ ] Asked once during Phase 1 spec approval ("Would you like GitHub integration?")
- [ ] Recorded in `spec.md` as `**GitHub integration:** enabled/disabled`
- [ ] When enabled: commits and pushes after every approved slice
- [ ] When disabled: skips commit silently
- [ ] Commit message is imperative mood, ≤72 chars, describes what the slice delivers
- [ ] User is told the commit message after every push
