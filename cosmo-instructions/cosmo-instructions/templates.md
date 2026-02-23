# Cosmo Templates

## Plan Template

Use this structure for `.state/current-plan.md` to track the evolving scope of the current slice.

---

# Current Plan

**Created:** {YYYY-MM-DD HH:MM}
**Last Updated:** {YYYY-MM-DD HH:MM}

---

## Original Goal

{What is the main goal of this slice?}

**Files:**
- `{file1}` - {what will change}
- `{file2}` - {what will change}

**Outcome:** {What the user will be able to do}

**Verification:** {How to verify it works}

---

## Iterations

### Iteration 1: {Brief description}
**Date:** {YYYY-MM-DD HH:MM}
**User Feedback:** {What the user requested}

**Changes to scope:**
- {Change 1}
- {Change 2}

**Updated outcome:** {Refined description if needed}

### Iteration 2: {Brief description}
**Date:** {YYYY-MM-DD HH:MM}
**User Feedback:** {What the user requested}

**Changes to scope:**
- {Change 1}
- {Change 2}

**Updated outcome:** {Refined description if needed}

---

## State Template

Use this structure for `.state/current-phase.md` to enable resuming work across sessions.

---

# Current Phase State

**Phase:** {1|2|3|4}
**Status:** {In progress|Paused|Waiting for approval}
**Started:** {YYYY-MM-DD HH:MM}
**Last Updated:** {YYYY-MM-DD HH:MM}

---

### Phase 1: Interview Context
*(Only fill if Phase = 1)*

**Questions Asked:**
- {question 1}
- {question 2}

**Answers Received:**
- {answer 1}
- {answer 2}

**Still Need to Ask:**
- {remaining question 1}
- {remaining question 2}

**Draft Spec Notes:**
{Any partial spec content or thoughts}

---

### Phase 2: Planning Context
*(Only fill if Phase = 2)*

**Goal:** {What slice are we planning?}

**Files Examined:**
- `{file1}` - {notes}
- `{file2}` - {notes}

**Approaches Considered:**
1. **{Approach name}**: {Description, pros/cons}
2. **{Approach name}**: {Description, pros/cons}

**Current Thinking:**
{Which approach leaning toward and why}

**Draft Plan:**
{Any partial plan text or structure}

**Next Steps:**
{What needs to happen before presenting plan}

---

### Phase 3: Implementation Context
*(Only fill if Phase = 3)*

**Approved Plan:**
{Copy of the plan being implemented}

**Progress:**
- [x] {Completed task}
- [ ] {In progress task}
- [ ] {Not started task}

**Files Modified:**
- `{file}` - {what was changed}

**Tests Status:**
- {Test file}: {passing/failing/not written}

**Build Status:** {passing/failing/not run}

**Issues/Blockers:**
{Any problems encountered}

**Next Steps:**
{What needs to happen next}

---

### Phase 4: Approval Context
*(Only fill if Phase = 4)*

**Slice Summary:**
{Brief description of what was implemented}

**Changes Made:**
{Summary of file changes}

**Test Results:**
{Test output summary}

**Build Results:**
{Build output summary}

**Waiting For:**
User approval decision

---

## Slice Template

Use this structure for `.state/slices/slice-{NUMBER}.md` to record completed work.

**Note:** Copy the plan content from `.state/current-plan.md` to capture the full scope including all iterations.

---

# Slice {NUMBER}: {TITLE}

**Timestamp:** {YYYY-MM-DD HH:MM:SS Z} (local time)
**Status:** {Approved/Rejected/In Progress}

---

## Plan

**Goal:** {All info and checklists from this slice's plan}

**Files:**
- `{file1}` - {description}
- `{file2}` - {description}

**Outcome:** {Expected outcome}

**Verification:** {How to verify it works}

---

## User Interactions

### Phase 1: Interview
```
{User interactions during spec creation, if applicable - omit if spec already exists}
```

### Phase 2: Planning
```
User: {user message}
Cosmo: {cosmo response}
```

### Phase 3: Implementation
```
{Any user interactions during implementation, if applicable}
```

### Phase 4: Approval
```
User: {approval decision}
```

---

## Build & Test Results

### Build
```
{build output}
```

**Status:** ✅ Success / ❌ Failed
**Duration:** {time}ms

### Tests
```
{test output if applicable}
```

**Status:** ✅ All Passing / ❌ {X} Failed / N/A

**Test Details:**
List each test created or modified in this slice, with pass/fail status and description:

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 1 | `{path/to/file.test.tsx}` | {test name} | ✅ Pass / ❌ Fail | {what it verifies, scenarios covered, expected behavior} |
| 2 | `{path/to/file.test.tsx}` | {test name} | ✅ Pass / ❌ Fail | {what it verifies, scenarios covered, expected behavior} |

---

## Manual Verification Tasks

Step-by-step tasks for the user to verify the implementation works as expected:

- [ ] {Verification task 1}
- [ ] {Verification task 2}
- [ ] {Verification task 3}

**Expected Results:**
- {What the user should observe/see}

---

## Summary

{Brief summary of what was accomplished and any notes}

---

## Test Report Template

Use this structure for `.state/test-report.md`. Append a new section after each approved slice — never overwrite existing entries.

---

# Test Report

## Slice {N}: {Title}

{One paragraph max: what this slice built and why it matters.}

| # | File | Test name | Status | What it verifies |
|---|------|-----------|--------|-----------------|
| 1 | `{path/to/file.test.tsx}` | {test name} | ✅ Pass / ❌ Fail | {what it verifies} |

---
