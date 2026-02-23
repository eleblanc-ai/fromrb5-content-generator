# Stack Checklist: React + Vite + TypeScript + Tailwind + Supabase

Use this after each slice to verify stack conventions are being followed. Each item is observable in code or output.

> **Maintenance:** This checklist mirrors `cosmo-instructions/stacks/react-vite-supabase.md`. Any change to the stack file must be reflected here in the same commit.

---

## Project Structure

- [ ] Source code lives under `src/` in the 3-bucket pattern: `app/`, `features/`, `shared/`
- [ ] No new top-level buckets added under `src/`
- [ ] Files use `kebab-case` naming
- [ ] React component exports use `PascalCase`
- [ ] Shared code was not created for a single feature's use (only if used by 2+)

---

## Verification

- [ ] `npm run verify` passes — all three checks: `tsc -b`, `eslint .`, `vitest run`
- [ ] No partial passes accepted (all three must be green)

---

## Styling

- [ ] Only Tailwind utility classes used — no CSS modules, no styled-components, no inline `style` props
- [ ] Design tokens defined via `@theme` in `index.css` (Tailwind v4 syntax), not hardcoded values
- [ ] If the slice touched CSS setup or added utility classes: `npm run build` was run and key class names appear in `dist/assets/*.css`

---

## UI Conventions

- [ ] No `alert()`, `confirm()`, or `prompt()` calls anywhere in the slice
- [ ] Confirmations and notifications use in-app modal/toast components

---

## Testing

- [ ] Test files are collocated: `component.tsx` and `component.test.tsx` in the same directory
- [ ] Mocks are at module boundaries (`vi.mock('./some-module')`) — pure logic is not mocked
- [ ] Hoisted mock functions use `vi.hoisted()`
- [ ] Tests cover complete workflows, not just isolated operations (especially for persistence and multi-step flows)

---

## TypeScript

- [ ] `"strict": true` is set in `tsconfig.json`
- [ ] No `// @ts-ignore` or `// @ts-expect-error` without an explanatory comment
- [ ] All component props are explicitly typed — no implicit `any`

---

## Supabase

### Auth
- [ ] Session management uses `supabase.auth.onAuthStateChange`
- [ ] Edge Functions call `supabase.auth.getUser(jwt)` with the JWT explicitly — not `getUser()` without argument

### Edge Functions
- [ ] Functions deployed with `--no-verify-jwt` flag
- [ ] Auth handled inside the function via the `Authorization` header

### Schema Changes
- [ ] Full migration SQL was presented directly in the chat (not just written to a file)
- [ ] RLS policies included in the same SQL block if a new table was created
- [ ] Every new table has RLS enabled
- [ ] Default RLS policy restricts rows to the owning user (`auth.uid() = user_id`)

---

## Import Boundaries

Run this and confirm zero results:

```bash
rg "from ['\"].*features/" src/features
```

- [ ] No feature-to-feature imports exist anywhere in `src/features/`
