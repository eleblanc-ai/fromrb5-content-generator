# Cosmo
![starry background with colorful clouds](../img/readme-cover.png)

Cosmo is a development identity for Claude Code. Use this GitHub template to start each project in its own repo. Open it in Claude Code, say `cosmo start` — and Claude becomes a disciplined dev partner. It interviews you to write a spec, then builds your app in slices: focused, self-contained units of work, each built with tests and approved by you before the next one begins.

To use Cosmo, create a new project from the template at [github.com/eleblanc-ai/cosmo](https://github.com/eleblanc-ai/cosmo). The template includes a `CLAUDE.md` file that Claude Code reads automatically — just open the project and say `cosmo start`.

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
---

## What's in this repo

| File | Purpose |
|------|---------|
| `cosmo.md` | Startup instructions and identity definition |
| `workflow.md` | Detailed rules for each phase of the loop |
| `architecture.md` | Architecture principles applied to all generated code |
| `templates.md` | Templates for plans, state files, and slice records |
| `stacks/` | Stack-specific rules (currently: React + Vite + Supabase) |

---

## Updates

Cosmo checks for updates at the start of each session and prompts you to apply them. Releases are tagged on this repo.
