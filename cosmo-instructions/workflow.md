# Cosmo Workflow: 4-Phase Loop

**Read this file completely before starting work.** This is your primary reference for all phases.

## Table of Contents
1. [Communication Guidelines](#communication-guidelines) - How to communicate during phases
2. [State Management](#state-management) - When and what to save
3. [Plan Management](#plan-management) - Tracking slice iterations
4. [Phase 1: Interview](#phase-1-interview) - Writing the spec
5. [Phase 2: Plan](#phase-2-plan) - Planning next slice
6. [Phase 3: Implement](#phase-3-implement) - Writing and verifying code
7. [Phase 4: Approval](#phase-4-approval) - Getting user approval

---

## Communication Guidelines

### Phase Indicators
**Always start responses by stating current phase:**
- `📋 Phase 1: Interview - Writing spec`
- `📋 Phase 2: Plan - Planning next slice`
- `🔨 Phase 3: Implement - Writing code and verifying quality`
- `✅ Phase 4: Approval - Presenting slice`

### Routing Questions
Routing questions appear **only when presenting the phase deliverable** — not on every response.

| Phase | Routing question | When to ask |
|-------|-----------------|-------------|
| 1 | "Does this spec capture your vision? (yes/no)" | Only after presenting the completed spec |
| 2 | "Approve this plan? (yes/no)" | Only after presenting the completed plan |
| 3 | *(none)* | Auto-proceed to Phase 4 after verification passes |
| 4 | "Approve this slice? (yes/no)" | Only after presenting the completed slice |

During intermediate work within a phase (asking interview questions, clarifying requirements, answering tangents), end responses with the next relevant question or action — not the routing question.

### Natural Conversation
You can have natural conversations during any phase:
- Answer user questions
- Discuss architectural approaches
- Explain concepts and decisions
- Clarify requirements

**After any tangent or side question, continue the conversation naturally.** Answer the question, then pick up the next thread as if the tangent didn't interrupt — no re-introductions, no "welcome back", no re-summarizing the phase. If the deliverable is ready, end with the routing question. If you're still working toward it, end with the next working question.

**Distinguish between continuing and resuming:**
- **Continuing (same session, after a tangent):** Just answer and carry on. Don't restate the phase or re-summarize what's in progress.
- **Resuming (new session, from `.state/current-phase.md`):** State the current phase, briefly restate where things stand, and ask the appropriate next question.

---

## State Management

**Maintain `.state/current-phase.md` to enable resuming work at any time.**

### When to Save State
- **Automatically (no user action needed):**
  - Plan approved → entering Phase 3: write `## Phase 3: Implement\n\nImplementing slice N: [name], plan approved.` to `current-phase.md`
  - Verification passes → entering Phase 4: update `current-phase.md` to `## Phase 4: Approval\n\nSlice N implemented, awaiting approval.`
- User says "pause", "stop", "save progress", or similar
- Taking a break or ending a session mid-phase
- Before a long tangent that might lose context

### When to Clear State
- Slice approved in Phase 4 (after writing slice file and test report)
- User explicitly requests starting fresh work

### What to Save (per phase)
**Update regularly during the phase:**
- Phase 1: Questions asked, answers received, remaining questions, draft spec notes
- Phase 2: Files examined, approaches considered, current thinking, draft plan
- Phase 3: Progress checklist, files modified, test status, issues/blockers
- Phase 4: Slice summary, changes made, test/build results

**Use State Template from `cosmo-instructions/templates.md`** for the state file structure. Only fill in the section relevant to current phase.

## Plan Management

**Maintain `.state/current-plan.md` to capture the full scope of each slice:**
- Phase 2 (on approval): Write approved plan to `.state/current-plan.md`
- Phase 4 (on "more work needed"): Append iteration details to `.state/current-plan.md`
- Phase 4 (on approval): Copy `.state/current-plan.md` content into slice report
- Phase 2 (next slice): Overwrite `.state/current-plan.md` with new plan

**Use Plan Template from `cosmo-instructions/templates.md`** for the plan file structure.

---

## Phase 1: Interview

### Say
"📋 Phase 1: Interview - Writing spec"

### Do
Ask questions one at a time. Gather: goals, users, core features, constraints, UI style. For UI style ask: "How should the app look and feel? Any colors, aesthetic, or apps you'd like it to resemble?" Write the spec to `.state/spec.md` using the **Spec Template** from `cosmo-instructions/templates.md` — every section must be filled.

**Identify the tech stack** during the interview. Check `cosmo-instructions/stacks/` for a matching stack file. If one exists, record it in spec.md:
```
**Stack file:** cosmo-instructions/stacks/react-vite-supabase.md
```
If no matching stack file exists: tell the user this stack is not currently supported, list the available stacks from `cosmo-instructions/stacks/`, and do not proceed.

**If updating existing spec:** Review the entire spec for consistency and accuracy before and after applying the change. Ensure the update doesn't conflict with existing requirements, data models, or architectural decisions. Update all affected sections, not just the section most directly related to the request.

**If the user requests something unconventional, technically problematic, or that conflicts with better-established approaches:** Gently point this out and suggest a more conventional or practical alternative. Briefly explain the tradeoff. Ultimately respect the user's decision if they want to proceed anyway.

### File Rules
**Must reference:** `.state/spec.md` (check if exists)
**Can modify:** `.state/spec.md` (create or update)
**Cannot modify:** Implementation files, test files, config files, slice files

### Then Ask
"Does this spec capture your vision? (yes/no)"

### Routing
- No → Phase 1 (continue, update state)
- Yes →
  1. **Ask about GitHub integration** — "Would you like Cosmo to create a GitHub repo for your project and commit after each approved slice? (yes/no)"
     - yes → run `gh auth status`:
       - If authenticated: confirm which account will be used, then record `**GitHub integration:** enabled` in `.state/spec.md`
       - If not authenticated: run `gh auth login` and walk them through it step by step. Do not proceed until authentication succeeds. Then record `**GitHub integration:** enabled` in `.state/spec.md`
     - no → record `**GitHub integration:** disabled` in `.state/spec.md`
  2. Clear `.state/current-phase.md`, then Phase 2

---

## Phase 2: Plan

**⚠️ You are in Phase 2. ONLY plan the next slice. Do NOT implement code or do work outside this phase.**

### Purpose
Identify the next smallest, shippable slice of work toward completing the spec.

### When to Use
- After spec is complete
- After a slice has been approved
- When resuming work

### Scope
- **May read**: Any files to understand context
- **May present**: Plans to the user
- **Must NOT modify**: Any code files, `.state/spec.md`, or `.state/slices/`

**The planner only plans. All code changes happen in Phase 3.**

### Required Reading
Before planning, you MUST read **in this order:**
1. **`cosmo-instructions/architecture.md`** - Universal architecture principles (READ THIS FIRST)
2. **Stack file** (if specified in `.state/spec.md`) - Stack-specific rules and patterns
3. **`.state/spec.md`** - Product requirements
4. **Architecture section in `.state/spec.md`** - Project-specific constraints (language, framework, structure)
5. **`.state/slices/*`** - What's already completed
6. **Current codebase** - What exists now, patterns to follow

**If requirements are unclear → STOP and ask the user.**

### Process

**1. Check if spec is complete:**
- If all spec features are implemented → Ask user: "All spec features are complete! What would you like to work on next?"
- Wait for user input (new features, polish, optimizations, etc.)
- If major new features → Suggest updating spec first
- If enhancements/polish → Proceed with planning

**2. Check if this is the first slice:**
- If no slices exist yet, the first slice MUST include:
  - Project setup (folder structure, dependencies, configuration)
  - Basic example module with simple functionality
  - Test for the example to verify test infrastructure works
  - Must achieve: Verification command passes (from spec.md)
- This ensures all future slices can include tests

**Project structure:** The workspace IS the project. Project files live at the root alongside `cosmo-instructions/`. Each workspace holds exactly one project — starting a new project means creating a new repo from the Cosmo template, not reusing an existing workspace.

When scaffolding on the first slice, scaffold into the current directory (e.g. `npm create vite@latest .`). The `cosmo-instructions/` folder and `.state/` will already be there — the scaffold tool should not overwrite them.

**3. Identify the next logical slice:**
- What are the prerequisites/dependencies?
- What's the smallest vertical slice that makes progress?
- What can be tested independently?
- What provides user-visible value?

**4. Check for refactoring needs:**
- Will this slice use any code currently in a feature folder?
- If yes, that code needs to be promoted to shared first
- Plan a separate refactoring slice before the feature slice
- Example: "Move AuthModal from features/admin to src/shared/components"

**5. Create the slice plan** with these elements:
- **Name**: 1-3 word description (becomes slice-N-name.md)
- **Goal**: One sentence - what this accomplishes
- **Why now**: Prerequisites, dependencies, logical order
- **Scope**:
  - **In scope**: What will be built in this slice
  - **Out of scope**: What explicitly won't be included (avoid scope creep)
- **User-visible outcome**: "User can ___" statement
- **File map**: Files to create or modify with brief purpose
- **Data/API assumptions**: Brief notes on data structures or contracts (if relevant)
- **Tests**: What tests will be added or updated
- **Verification**: How to verify it works (command + manual steps if needed)
- **Risks/Open decisions**: Any unknowns or tradeoffs to discuss

**6. Verify plan completeness:**
- Is the slice minimal and clear?
- Is verification defined?
- Are there unanswered architectural conflicts?
- If yes to any → refine the plan

**7. Present the complete plan to user**

**8. Get user approval before proceeding**

### Slice Sizing Guidelines

A slice is a small, focused increment of work.

**Good slices** (1-3 files, one focused session):
- Project setup with example and test
- Single module/component with tests
- One API endpoint with handlers
- Database schema for one entity
- One feature workflow (e.g., login only, not full auth)
- Has clear done criteria, can be tested, adds user value, doesn't break code

**Refactoring slices** (when needed):
- Move module from feature to shared (when needed by 2+ features)
- Extract duplicated logic to shared utility
- Reorganize folder structure to match architecture

**Too large** (break down):
- "Complete user management" → create, list, edit (separate slices)
- "Full auth system" → login, logout, password reset (separate)
- "Dashboard with visualizations" → layout, data fetching, charts (separate)

### Rules
- **One slice at a time**: Don't plan multiple slices ahead
- **Small and focused**: 1-3 files per slice, one clear purpose
- **Build in order**: Dependencies first, then features that use them
- **Never invent behavior**: If unclear, stop and ask
- **Complete plans only**: Internal consistency is required
- If a slice feels large, break it down further

### Stop Condition
Planning is finished when ALL of these are true:
- The slice is minimal and clear
- User-visible outcome is defined ("User can ___")
- Verification is defined (how to test/verify)
- No unanswered architectural conflicts remain
- Plan is complete and internally consistent

**Then STOP and present to user. Do NOT proceed to implementation without approval.**

### Plan Presentation Format

Present your plan to the user in this format:

```
## Slice [N]: [1-3 word name]

**Goal**: [One sentence describing what this accomplishes]

**Why now**: [Prerequisites, dependencies, why this is the logical next step]

**Scope**:
- In scope: [What will be built]
- Out of scope: [What won't be included]

**User-visible outcome**: User can [do something specific]

**Files**:
- `path/to/file` (create) - [brief purpose]
- `path/to/other` (modify) - [what changes]

**Data/API assumptions**: [Any assumptions about data structures or APIs]

**Tests**:
- [What tests will be added/updated]

**Verification**:
- Run verification command from spec.md
- [Any manual verification steps]

**Risks/Open decisions**:
- [Any unknowns or tradeoffs to discuss]

Approve this plan?
```

### Then Ask
"Approve this plan? (yes/no)"

### Routing
- No → Phase 2 (continue, update state)
- Yes → Write approved plan to `.state/current-plan.md`, write `## Phase 3: Implement\n\nImplementing slice N: [name], plan approved.` to `.state/current-phase.md`, then Phase 3

---

## Phase 3: Implement

**⚠️ You are in Phase 3. ONLY implement the approved plan. Do NOT respond to other requests or do work outside this phase.**

### Purpose
Implement exactly one slice from the approved plan.
Deliver a fully verified, minimal, production-ready change.

### When to Use
- After slice plan approved by user
- When implementing changes requested during review

### Scope
- **May modify**: Source code, tests, config, dependencies (only as specified in approved plan)
- **Must NOT modify**: `.state/spec.md` or `.state/slices/`, or files outside approved plan scope

**Only implement what was approved. No scope creep.**

**Note:** Specific file paths depend on your project structure (defined in spec.md).

### Required Reading
Before coding, you MUST read:
- The approved plan from Phase 2
- **`cosmo-instructions/architecture.md`** - Architecture rules
- **Stack file** (if specified in `.state/spec.md`) - Stack-specific rules and patterns
- `.state/spec.md` - Product requirements + Architecture section (project-specific rules)
- Relevant existing code to understand patterns

**If the plan is unclear or incomplete → STOP and ask.**

### Process
1. **Read all required inputs** (listed above)
2. Read relevant existing code to understand patterns
3. Implement the slice:
   - Create/modify files as planned
   - Follow architecture rules from `architecture.md` and `spec.md`
   - Write code that matches existing patterns
   - Add or update tests for any new or changed behavior

4. **Verify your work** (mandatory):
   - Run verification command from spec.md (e.g., `npm run verify`, `make test`, `./verify.sh`)
   - **ALL checks must pass**: type-check, lint, and tests
   - If verification fails: fix, rerun, repeat until passing
   - **You CANNOT proceed to Phase 4 while verification fails**
   - **No manual verification** - only automated verification counts

5. **For slices involving build-time asset generation** (e.g. CSS frameworks that compile at build time): run a production build and verify the expected output is present. A passing verify command does not cover generated assets — see your stack file for specifics.

6. After verification passes, proceed to Phase 4 (Review)

### Architecture Compliance

**Read `cosmo-instructions/architecture.md` for complete guidelines.**

Key points:
- **File placement**: Features vs shared vs app buckets (no new top-level buckets)
- **Import boundaries**: ❌ No feature-to-feature imports
- **Avoid premature abstraction**: Only create shared code when used by 2+ features

### Testing Requirements
You MUST:
- **Add or update tests** for any new or changed behavior
- **Ensure regression safety** for existing behavior
- **Never remove tests** unless explicitly part of the approved plan
- Tests should match the existing test patterns in the codebase
- **If no tests exist yet** (first slice): Set up testing infrastructure per spec.md and add basic tests

### Test Planning Strategy

Before writing tests, identify **full user workflows** rather than isolated operations:

**Think in complete cycles:**
- Don't just test: "save works" and "load works" separately
- Test the full cycle: save → close app → reopen app → data appears
- Example: Persistent storage requires testing lifecycle boundaries (shutdown/restart)

**Identify what the system must survive:**
- Application restarts (state persistence)
- Network failures (API calls, retries)
- Invalid data (corrupted storage, bad responses)
- Concurrent operations (race conditions)

**Watch for test gaps:**
- Tests that check in-memory state but not underlying persistence
- Tests that mock away the exact thing you need to verify
- Tests that start with pre-populated state but never test initialization
- Tests that verify individual operations but miss cumulative effects

**Example: Persistence testing**
```
// ❌ Weak: Tests save and load separately
test('saves to storage') → { add item, check storage }
test('loads from storage') → { pre-fill storage, start app, check display }
// Problem: Load test sets storage before app starts, checks display, but save
// logic might corrupt storage afterward. Test passes but app fails.

// ✅ Strong: Tests the full cycle
test('persists data across restarts') {
  1. Start application (empty state)
  2. Add item (triggers save)
  3. Shutdown application
  4. Restart application
  5. Verify item still exists
}
```

**Questions to ask yourself:**
- If the user closes and reopens the app, does my test verify data survives?
- If the system restarts, do my tests simulate this?
- Am I testing what the user experiences or just what in-memory state shows?
- Does this test actually exercise the full code path from start to finish?

### Test Coverage
Write tests that cover:
- Initial state and setup
- User interactions and operations
- State changes and updates
- Edge cases (empty inputs, validation, boundaries)
- Multiple items/operations
- **Complete workflows** (especially for persistence, external integrations, multi-step processes)

### Code Quality Rules
- **Functions**: ≤ 50 lines, cyclomatic complexity ≤ 8, ≤ 5 positional params
- **Lines**: 100-char max (or project standard), no relative `..` imports
- **Naming**: Clear, descriptive names that reduce need for comments
- **Imports**: Only what you need, no unused exports or dead code
- **Style**: Consistent with codebase
- **Error handling**: Fail fast with clear messages, never swallow exceptions silently
- **Type checking**: All code must pass static type checks (if language supports it)
- **Doc comments**: On non-trivial public APIs (use project style guide)
- **Comments**: Only where logic isn't self-evident (no obvious, repeated, or commented-out code)
- **Configuration**: In proper location per `architecture.md`, no hardcoded paths

### Additional Standards

**Bash**: Use strict mode (`#!/bin/bash` + `set -euo pipefail`). Lint with `shellcheck` and `shfmt`.

**Git**: Imperative mood, ≤72 char subject. One logical change per commit. Never amend/rebase pushed commits.

**Secrets**: Never commit secrets. Use gitignored `.env` files and environment variables.

**Testing**: Mock boundaries (I/O, time, external services), not logic or pure functions. Verify tests fail when code breaks. Test file placement should follow project conventions (see spec.md). Integration tests when in doubt.

**CI**: No scheduled runs without code changes.

### Completion Criteria
The slice is complete ONLY when ALL of these are true:
- ✓ Implementation matches the approved plan
- ✓ Verification command passes (all checks: type-check, lint, tests)
- ✓ All tests pass (existing + new)
- ✓ **Tests exist for all new functionality** (no untested code)
- ✓ Diff is minimal and scoped to the slice
- ✓ **No existing functionality outside the slice scope was removed or broken**
- ✓ Architecture boundaries respected
- ✓ No unused imports, exports, or dead code introduced by this slice
- ✓ Documentation updated where required
- ✓ Codebase remains architecturally consistent

**If any criterion fails, the slice is not complete.**

### Stop Condition
When all completion criteria are satisfied:
- **STOP** - Do not add extra improvements
- **STOP** - Do not refactor unrelated code
- **STOP** - Do not optimize prematurely
- Proceed to Phase 4 (Review)

### Common Pitfalls (Avoid These)
- **Modifying out-of-scope existing code** — apply tiered judgment based on risk:
  - **Additive** (new param with a default, new export, new optional field): make the change and note it in the Phase 4 summary
  - **Behavioral** (changes how existing logic works, alters return values, side effects): stop and flag to the user before proceeding
  - **Breaking** (changes an existing interface, removes or renames a param, alters a contract): hard stop — do not proceed without explicit user approval
- Refactoring code not in the approved plan
- Adding features beyond the plan or speculative "might be useful" functionality
- Creating abstractions for one-time use (wait until code is written 3+ times)
- Adding config for hypothetical future needs
- Adding unnecessary dependencies (each is attack surface + maintenance burden)
- Documenting or validating features that aren't implemented yet (no phantom features)
- **Skipping tests** - Every slice with code changes needs tests
- Changing architecture patterns without discussion
- Using `type: ignore` or skipping type checks without justification

### Security Considerations
Be careful to avoid:
- Command injection vulnerabilities
- XSS vulnerabilities
- SQL injection
- Insecure authentication/authorization
- Exposed secrets or credentials
- OWASP Top 10 vulnerabilities

**If you notice security issues: fix them immediately OR note them for the next slice.**

### Then
Update `.state/current-phase.md` to `## Phase 4: Approval\n\nSlice N implemented, awaiting approval.`, then present Phase 4 immediately — do NOT wait for the user to trigger it, but DO stop after asking the approval question and wait for explicit user input before taking any action.

---

## Phase 4: Approval

### Say
"✅ Phase 4: Approval - Presenting slice for final approval"

### Do
Present the slice to the user using the **Slice Template** from `cosmo-instructions/templates.md` as the format — do not summarize, include actual output (real test results, real verify output, real file list). This is the preview of what will be recorded if approved.

**Always include the Manual Verification Tasks section directly in the chat.** The user must not have to open any file to find their checklist — it must appear in every slice presentation, including after iterations.

**If the slice includes schema or migration changes, always present them directly in the chat.** The user needs them in front of them to run — see your stack file for the exact format required.

### Then Ask
"Approve this slice? (yes/no)"

**STOP here. Do not write files, commit, or push until the user explicitly responds with "yes".**

### Routing
- yes →
  1. Write the slice file to `.state/slices/slice-{N}-{name}.md` using the Slice Template from `cosmo-instructions/templates.md` (same content as the preview above)
  2. Append this slice's entry to `.state/test-report.md` using the Test Report Template from `cosmo-instructions/templates.md` — one paragraph summary + test table for this slice only
  3. Clear `.state/current-plan.md` and `.state/current-phase.md`
  4. Check `.state/spec.md` for `**GitHub integration:**`:
     - `enabled` → from the repo root: `git add -A && git commit -m "{message}" && git push` — imperative mood, ≤72 char subject line, summarizing what the slice delivers (e.g. `Add sign-up confirmation toast`). After pushing, tell the user: "Committed and pushed: {commit message}"
     - `disabled` → skip commit
  5. Then Phase 2
- no → Ask what needs to change. Then:
  1. **Check if the change affects the spec** — if so, update `.state/spec.md` and show the user the updated section before proceeding
  2. Update `.state/current-plan.md` with iteration details
  3. Return to Phase 3 to implement the change
  4. Return to Phase 4 and **present the full updated slice** — never ask for approval without showing the updated work first

**⚠️ The slice file is ONLY written after the user approves. Never before. Never speculatively.**
