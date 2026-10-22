# AGENTS.md

Rules for any AI agent working on this repository through the `swarm/`
orchestrator. Written for the agent, not for the human reviewer.

## Architecture

Moneta is a personal expense tracker.

- **Stack**: React 19 + TypeScript + Vite, SCSS (BEM), Recharts, Supabase
  (Postgres + RLS) as the only backend, deployed to GitHub Pages.
- **State**: custom hooks under `src/hooks/*`, one hook per concern
  (`useExpenses`, `useCategories`, `useBudgetGoal`, `useAuth`, ...). Hooks own
  their Supabase calls and expose plain data + action functions; components
  do not call `supabase` directly.
- **Types**: shared interfaces live in `src/types/index.ts`. Add new types
  there rather than inlining them in a component.
- **Constants**: `src/constants.ts` holds static data (`CATS`) and small pure
  helpers (`fmt`, `getCat`).
- **Pure logic**: anything that can be expressed as a pure function (sums,
  grouping, formatting, validation) belongs in `src/utils/*`, not inline in a
  hook or component. This is what makes it testable without mocking
  Supabase or React state.
- **Styling**: SCSS with BEM class names (`block__element--modifier`), files
  under `src/styles/`. No CSS-in-JS, no utility-class frameworks.
- **i18n**: `react-i18next`, translation keys under `src/i18n/`. User-facing
  strings always go through `t(...)`, never hardcoded.

## Conventions

- TypeScript `strict` mode is on. No `any` unless there is no reasonable
  alternative, and never to silence a type error you don't understand.
- Comments are short, in English, and explain *why*, not *what* — the code
  already says what it does. Use `/** ... */` docblocks for anything worth
  commenting; avoid line-by-line narration of obvious code.
- Never reference ticket systems (Redmine, Jira, or similar) in comments,
  commit messages, card files, or documentation. This project tracks work
  through the `kanban/` cards in this repository only.
- Match the file's existing formatting (alignment of `=`, blank line
  conventions, etc.) rather than reformatting unrelated lines.
- New dependencies are never added by an agent. If a task seems to need one,
  stop and say so in the task's output instead of running `npm install`.

## Forbidden zones

These are off-limits for any automated change, regardless of what a card's
file whitelist says. The orchestrator also enforces this with a diff check
after the agent runs — touching any of these is an automatic rejection:

- Everything under `supabase/`, any `supabase-*.sql` migration file, and
  `src/lib/supabase.ts` (client configuration).
- Authentication logic: `src/hooks/useAuth.ts`, and the password-reset token
  handling in `src/main.tsx`.
- `.env`, `.env.*`, and any other file holding secrets or deploy
  configuration (`.github/workflows/*`).
- `package.json` and `package-lock.json` (dependency changes require human
  approval).
- The orchestrator itself: `swarm/`, `AGENTS.md`, `scripts/gate.sh`.

## Definition of done

A card is done only when all three hold:

1. `scripts/gate.sh` exits 0 (lint, typecheck, tests, build all pass).
2. Every acceptance criterion listed in the card is met.
3. `git diff --name-only` against the base branch contains only files from
   the card's `files` whitelist — nothing else was created, modified, or
   deleted.

Any one of these failing means the card is not done, no exceptions.

## Working on a card

- Keep the change scoped to exactly what the card describes. If a card
  seems to require touching a file outside its whitelist, stop and say so
  instead of expanding scope on your own.
- Write tests that exercise real behavior and edge cases (empty input,
  boundary values, error paths) — not placeholder assertions like
  "function exists" or "returns a value".
- Prefer extending existing patterns (hooks, utils, BEM naming) over
  introducing a new one for a single card.
