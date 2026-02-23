# Stack: React + Vite + TypeScript + Tailwind + Supabase

This file defines stack-specific rules for projects using React 18+, Vite, TypeScript, Tailwind CSS v4, and Supabase (Auth + Postgres + Edge Functions).

---

## Scaffolding

```bash
npm create vite@latest PROJECT_NAME -- --template react-ts
cd PROJECT_NAME
npm install
```

Install project dependencies:
```bash
npm install @supabase/supabase-js
npm install -D tailwindcss @tailwindcss/vite vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom eslint typescript-eslint
```

---

## Project Structure

Use the 3-bucket pattern:

```
src/
├── app/           ← Application shell (routing, providers, entry point)
├── features/      ← User-facing capabilities (one folder per feature)
└── shared/        ← Code used by 2+ features (components, config, utils)
```

File naming: `kebab-case` for files, `PascalCase` for React component exports.

---

## Verification

```bash
npm run verify    # runs: tsc -b && eslint . && vitest run
```

All three checks must pass before a slice is complete. This is the single verification command — do not accept partial passes.

---

## Styling (Tailwind CSS)

- **Utility classes only** — no CSS modules, no styled-components, no inline `style` props
- Design tokens defined via `@theme` in `index.css` (Tailwind v4 syntax)
- Dark mode via class strategy: `@custom-variant dark (&:where(.dark, .dark *))`

**After any slice involving CSS setup or new utility classes:** run a production build and confirm expected classes appear in the compiled stylesheet. A passing `verify` command does not guarantee CSS output — the stylesheet can be empty while all tests pass.

```bash
npm run build
# Then spot-check dist/assets/*.css for key class names
```

---

## UI Conventions

- **No browser dialogs** — never use `alert()`, `confirm()`, or `prompt()`. Always use in-app modal components for confirmations and notifications.

---

## Testing

- **Framework:** Vitest + React Testing Library
- **File placement:** Collocated — `component.tsx` + `component.test.tsx` in the same directory
- **Mock strategy:** Mock at module boundaries (`vi.mock('./auth-provider')`); never mock pure logic
- **Test setup:** `vi.hoisted()` for hoisted mock functions

```ts
// Standard mock pattern
const mockFn = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }))
vi.mock('./some-module', () => ({ useThing: () => ({ fn: mockFn }) }))
```

---

## TypeScript

- Strict mode required — `"strict": true` in `tsconfig.json`
- Never use `// @ts-ignore` or `// @ts-expect-error` without a comment explaining why
- All component props typed explicitly — no implicit `any`

---

## Supabase

### Auth
- Use `supabase.auth.onAuthStateChange` for session management
- In Edge Functions, pass the JWT explicitly: `supabase.auth.getUser(jwt)` — `getUser()` without a JWT fails in Deno's sessionless context

### Edge Functions
- Deploy with `--no-verify-jwt` flag so the Supabase gateway doesn't block requests before your function handles auth in code:
  ```bash
  supabase functions deploy FUNCTION_NAME --no-verify-jwt
  ```
- Handle auth inside the function using the `Authorization` header

### Schema Changes
**Always present the full SQL in the chat when a slice includes schema changes.** The user needs it in front of them to run in the Supabase SQL editor — do not just write it to a file.

```sql
-- Example: always show the actual migration SQL
ALTER TABLE recipes ADD COLUMN ai_context jsonb;
```

Include RLS policies in the same SQL block if they're part of the change.

### Row Level Security
- Every table must have RLS enabled
- Default policy: users can only access their own rows (`auth.uid() = user_id`)
- Always include RLS setup when creating a new table

---

## Import Boundary Check

```bash
rg "from ['\"].*features/" src/features
```

Must return no results. Run this during Phase 4 before presenting the slice.
