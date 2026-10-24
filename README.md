# moneta

Personal finance tracker — track your monthly expenses, visualize spending habits and monitor trends over time.

**[Live Demo →](https://kacperdn.github.io/moneta/)**

---

## Features

**Tracking**
- Add, edit and delete expenses — tap any entry in the history list to edit it
- Custom amount field with −/+ steppers and quick-add chips (no browser number spinner)
- Custom expense categories — change the icon/color of any default category, add your own, or hide any of them without losing historical data
- Optional monthly budget goal with a live progress bar

**Insight**
- Monthly spending breakdown with a donut chart — click a category to drill into its individual expenses
- Category filtering in the history view and a temporary "exclude from breakdown" toggle in the chart view
- Daily bar chart for the selected month
- Multi-month trend chart with % change indicator
- Month summary panel next to the history list on desktop

**Data**
- Export to CSV — the whole history from Settings, or a single month from the history view (Excel-friendly, RFC 4180)
- Cloud database — data syncs across all devices (an internet connection is required; only the app shell is cached offline)

**Experience**
- Responsive layout: sidebar + dashboard grid on desktop, bottom tab bar on phones
- Scroll-triggered reveal animations, plus scroll-linked effects on the landing page where the browser supports them
- Landing page with a product preview, feature grid and a scroll-down cue; split-screen sign-in on wide screens
- Dark and light theme, persisted per device
- Polish and English interface, switchable in Settings
- Installable as a PWA

**Account & reliability**
- Email/password authentication with persistent sessions, plus email-based password reset
- In-app privacy policy
- User-friendly error handling — backend/config errors never leak to the UI, with a top-level crash fallback
- Toast notifications for every action

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styles | SCSS (BEM methodology, partials) |
| Icons | lucide-react |
| Charts | Recharts |
| i18n | i18next / react-i18next (Polish + English) |
| Notifications | react-hot-toast |
| PWA | vite-plugin-pwa (installable, offline app shell) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT + RLS) |
| Quality | ESLint + typescript-eslint, `tsc`, Vitest |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

## Architecture

```
Browser (React + TypeScript)
        ↓
GitHub Pages — static files
        ↓
Supabase REST API
        ↓
PostgreSQL + Row Level Security
```

No custom backend server. The React app communicates directly with Supabase via REST API. Each user can only access their own data, enforced at the database level via Row Level Security policies.

Every push to `main` triggers a GitHub Actions workflow ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) that lints, type-checks, tests, builds, and publishes `dist/` to the `gh-pages` branch — no manual deploy step.

## Getting started

```bash
npm install
```

Create a `.env` file with your Supabase project values:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_KEY=...
```

Run these once in the Supabase SQL Editor for a new project (alongside an `expenses` table with `id`, `description`, `cat`, `amount`, `date`, `user_id`, `created_at` and per-user RLS policies):
- [supabase-budgets-migration.sql](supabase-budgets-migration.sql) — the monthly budget goal
- [supabase-categories-migration.sql](supabase-categories-migration.sql) — per-user category overrides (icon/color/hidden) and custom categories
- [supabase-expenses-update-migration.sql](supabase-expenses-update-migration.sql) — row-level policy that lets users edit their own expenses

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint (app code and the `swarm/` scripts) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (watch mode; add `-- --run` for a single run) |
| `bash scripts/gate.sh` | The full quality gate: lint → typecheck → tests → build |

Business logic that can be pure (sums, grouping, CSV, amount parsing) lives in `src/utils/` and is unit-tested without mocking Supabase or React.

## Project Structure

```
src/
├── hooks/
│   ├── useAuth.ts            # session management
│   ├── useExpenses.ts        # data fetching and mutations (add / update / remove)
│   ├── useCategories.ts      # merges default + custom categories (Supabase)
│   ├── useBudgetGoal.ts      # monthly budget goal (Supabase)
│   ├── useTheme.ts           # dark/light theme, persisted
│   ├── useLanguage.ts        # PL/EN language, persisted
│   ├── useCountUp.ts         # animated number count-up
│   ├── useScrollReveal.ts    # fade/slide elements in as they scroll into view
│   ├── useScrollProgress.ts  # scroll progress for the landing progress bar
│   └── useMediaQuery.ts      # media query subscription (chart sizing)
├── i18n/
│   ├── index.ts              # i18next init
│   └── locales/              # pl.json, en.json
├── lib/
│   ├── supabase.ts           # Supabase client
│   └── errors.ts             # maps Supabase errors to user-friendly messages
├── components/
│   ├── Dialogs.tsx           # confirm / budget / category-hint / drill-down dialogs
│   ├── EditExpenseDialog.tsx # edit an existing expense
│   ├── HistoryView.tsx       # history tab (month list, category filter, summary, export)
│   ├── RecentExpenses.tsx    # latest entries next to the add form
│   ├── AmountInput.tsx       # amount field with stepper and quick amounts
│   ├── MonthSelect.tsx       # custom month dropdown
│   ├── DashboardMock.tsx     # decorative dashboard preview (landing, auth)
│   └── Skeleton.tsx          # loading placeholder
├── utils/
│   ├── expenseStats.ts       # monthly / per-category sums (pure, tested)
│   ├── expenseList.ts        # replace an edited expense in the list (pure, tested)
│   ├── exportCsv.ts          # expenses -> CSV string (pure, tested)
│   ├── amount.ts             # amount input sanitizing / formatting (pure, tested)
│   └── downloadFile.ts       # browser file download helpers
├── styles/
│   ├── main.scss             # entry point, lists the partials in cascade order
│   ├── _tokens.scss          # colors (light/dark), spacing, breakpoints, mixins
│   ├── _components.scss      # base + component styles (BEM)
│   └── _app-desktop.scss, _landing.scss, _screens.scss, ...  # responsive layers
├── types/
│   └── index.ts              # TypeScript interfaces
├── constants.ts              # default categories, formatting helpers
├── icons.tsx                 # shared lucide-react icon set
├── categoryIcons.tsx         # icon picker resolver for expense categories
├── App.tsx                   # dashboard / add / history views, navigation
├── Landing.tsx               # marketing page (pre-login)
├── Auth.tsx                  # login / register / reset-request screen
├── AuthLayout.tsx            # shared split-screen layout for auth screens
├── PasswordReset.tsx         # set-new-password screen (from email link)
├── Settings.tsx              # theme, language, categories, CSV export, privacy policy, logout
├── CategoryManager.tsx       # add/edit/hide/delete expense categories
├── PrivacyPolicy.tsx         # in-app privacy policy
└── ErrorBoundary.tsx         # top-level crash fallback

scripts/gate.sh               # lint + typecheck + tests + build
kanban/                       # task cards for the AI orchestrator
swarm/                        # AI orchestrator (see below)
docs/SWARM.md                 # how the orchestrator works
```

## AI task orchestrator

This repo also includes a small, model-agnostic orchestrator (`swarm/`) that
runs scoped coding tasks through an AI worker, a hard quality gate
(lint/typecheck/tests/build), and a second AI model acting as reviewer,
before anything reaches a human. Forbidden zones (auth, Supabase config,
secrets, deploy config) are enforced by diffing the actual file changes, not
just by asking the model nicely. Nothing is merged to `main` automatically.

See [docs/SWARM.md](docs/SWARM.md) for the full design, a flow diagram, and
an honest list of its current limitations.

## License

MIT © KacperDn
