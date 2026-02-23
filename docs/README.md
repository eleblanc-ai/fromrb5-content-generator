
# Cosmo
![starry background with colorful clouds](/img/readme-cover.png)

Cosmo is a template repository for building React apps with an AI dev partner. Cosmo interviews you to write a spec, then builds your app in slices: focused, self-contained units of work scoped to one feature or concern, each built with tests and approved by you before the next one begins.

The `cosmo-instructions/` folder contains the Cosmo framework. Your project files live alongside it in the workspace.

---

## Contents

- [How it works](#how-it-works)
- [Getting started](#getting-started)
- [Workspace structure](#workspace-structure)
- [Updating Cosmo](#updating-cosmo)
- [Example session](#example-session)

---

## How it works

Cosmo runs a 4-phase loop, repeating until you decide your product is complete.

```
Phase 1: Interview   →  Write the spec together
Phase 2: Plan        →  Scope the next slice
Phase 3: Implement   →  Build it, test it, verify it
Phase 4: Approval    →  Review, approve, or iterate
```

Each slice is a single focused increment — one feature, one concern, one thing you can review and approve in a conversation. Before a slice is recorded as done, it must pass tests, build successfully, and pass manual verification steps you perform in the browser. Nothing is committed to your slice history until you approve it. State is saved to `.state/` between sessions, so Cosmo always picks up exactly where you left off — mid-interview, mid-plan, or mid-implementation.

Optionally, Cosmo can initialize your project as a GitHub repo and commit after every approved slice, giving you a clean history of exactly what was built and when.

*Currently optimized for React 18, TypeScript, Vite, Tailwind CSS, and Supabase. Support for additional stacks is planned.*

---

## Getting started

Cosmo runs inside an AI coding agent using project instructions.

**1. Create your project from the template**

```bash
gh repo create my-project --template eleblanc-ai/cosmo --clone --private
```

This creates a fresh repo in your GitHub account with a clean history and clones it locally.

**2. Open in your AI coding agent**

Open your cloned folder with a Claude coding agent that supports project-level instructions and tool use. Tested with GitHub Copilot agent mode in VS Code (with Claude).

**3. Start a session**

Set your agent's project instructions to:

```
Read cosmo-instructions/cosmo.md and follow it.
```

Cosmo checks for saved state and picks up exactly where you left off, or starts Phase 1 if you're new.

**4. Pause and resume**

```
pause cosmo
```

Cosmo saves its phase context so the next session resumes without losing anything. To restart after pausing:

```
start cosmo
```

---

## Workspace structure

Each workspace holds exactly one project. Project files live at the root alongside the `cosmo-instructions/` framework folder.

```
my-project/
├── cosmo-instructions/                 ← Cosmo framework (read-only)
│   ├── cosmo.md           ← Identity instructions
│   ├── workflow.md        ← The 4-phase loop
│   ├── architecture.md    ← Universal architecture principles
│   ├── templates.md       ← Document templates
│   └── stacks/            ← Stack-specific rules
├── VERSION                ← Installed framework version
├── .state/          ← Project state
│   ├── spec.md            ← Your product spec (Phase 1 output)
│   ├── current-phase.md   ← Resume point when pausing
│   ├── current-plan.md    ← Active slice plan
│   ├── test-report.md     ← Cumulative test report
│   └── slices/            ← Completed slice records
│       ├── slice-1-project-setup.md
│       ├── slice-2-auth.md
│       └── ...
├── src/                   ← Your app (scaffolded at first slice)
├── package.json
└── ...
```

Cosmo never edits framework files. To start a new project, clone a fresh copy of this template.

**Framework files:**

| File | Purpose |
|------|---------|
| `cosmo.md` | Startup instructions and identity definition |
| `workflow.md` | The 4-phase loop: Interview → Plan → Implement → Approval |
| `architecture.md` | Architecture principles applied to all generated code |
| `templates.md` | Templates for plans, state files, and slice records |
| `stacks/` | Stack-specific rules (currently: React + Vite + Supabase) |
| `VERSION` | Current version — checked at startup to detect updates |

---

## Updating Cosmo

Cosmo checks for updates at the start of each session and prompts you to apply them. If an update is available and you say yes, Cosmo downloads the new framework files, updates `VERSION`, and commits the change to your workspace.

---

## Example session

```
You:    start cosmo
Cosmo:  Update available (your version: 1.2, latest: 1.3). Update now? (yes/no)

You:    yes
Cosmo:  Updated. Phase 1: Interview — Writing spec
        Tell me about the product you want to build.

You:    A flashcard app. Create decks, flip through cards, track what you know.
Cosmo:  Got it. A few questions to sharpen the spec...
        [interviews you, writes spec.md]
        Does this spec capture your vision? (yes/no)

You:    yes
Cosmo:  Phase 2: Plan — Scoping next slice
        [reads spec, examines codebase, proposes Slice 1]
        Approve this plan? (yes/no)

You:    yes
Cosmo:  Phase 3: Implement — Building and verifying
        [builds, tests, verifies]
        Phase 4: Approval — Presenting slice
        All 9 tests pass. Here's what was built...

        Manual verification:
        [ ] npm run dev → app loads without errors
        [ ] Create a new deck — it appears in the list of decks
        [ ] Add a card to the deck — card count updates

        Approve this slice? (yes/no)

You:    yes
Cosmo:  Phase 2: Plan...
```

Saying **no** at any step keeps you in the loop:

- **No to update** — skips the update and continues the session as-is.
- **No to spec** — Cosmo asks what's off and keeps refining until you're satisfied.
- **No to plan** — Cosmo asks what to change and revises the slice proposal.
- **No to slice** — Cosmo asks what needs to change, goes back to Phase 3 to fix it, then presents the full updated slice for approval again.
