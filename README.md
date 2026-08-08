# moneta 

Personal finance tracker — track your monthly expenses, visualize spending habits and monitor trends over time.

**[Live Demo →](https://kacperdn.github.io/moneta/)**


---

## Features

-  Monthly spending breakdown with donut chart — click a category to drill into its individual expenses
-  Multi-month trend chart with % change indicator
-  Custom expense categories — rename the icon/color of any default category, add your own, or hide any of them without losing historical data
-  Category filtering in the list view and a temporary "exclude from breakdown" toggle in the chart view
-  Daily bar chart for the current month
-  Dark and light theme, persisted per device
-  Polish and English interface, switchable in Settings
-  Marketing landing page with a coverflow-style feature carousel, separate from a simplified sign-in screen
-  In-app privacy policy
-  Email/password authentication with persistent sessions, plus email-based password reset
-  Cloud database — data syncs across all devices
-  Mobile-first responsive design, installable as a PWA (works offline for the app shell)
-  Optional monthly budget goal with a live progress bar, synced via Supabase
-  User-friendly error handling — backend/config errors never leak to the UI, with a top-level crash fallback
-  Toast notifications for every action (add/delete/errors)
-  CI/CD — every push to `main` is linted, built, and deployed automatically

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styles | SCSS (BEM methodology) |
| Icons | lucide-react |
| Charts | Recharts |
| i18n | i18next / react-i18next (Polish + English) |
| Notifications | react-hot-toast |
| PWA | vite-plugin-pwa (installable, offline app shell) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT + RLS) |
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

Every push to `main` triggers a GitHub Actions workflow ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) that lints, builds, and publishes `dist/` to the `gh-pages` branch — no manual deploy step.

Two tables back the optional/customizable features — run both once in the Supabase SQL Editor for a new project:
- [supabase-budgets-migration.sql](supabase-budgets-migration.sql) — the monthly budget goal
- [supabase-categories-migration.sql](supabase-categories-migration.sql) — per-user category overrides (icon/color/hidden) and custom categories

## Project Structure

```
src/
├── hooks/
│   ├── useAuth.ts         # session management
│   ├── useExpenses.ts     # data fetching and mutations
│   ├── useCategories.ts   # merges default + custom categories (Supabase)
│   ├── useBudgetGoal.ts   # monthly budget goal (Supabase)
│   ├── useTheme.ts        # dark/light theme, persisted
│   ├── useLanguage.ts     # PL/EN language, persisted
│   └── useCountUp.ts      # animated number count-up
├── i18n/
│   ├── index.ts           # i18next init
│   └── locales/           # pl.json, en.json
├── lib/
│   ├── supabase.ts        # Supabase client
│   └── errors.ts          # maps Supabase errors to user-friendly messages
├── styles/
│   └── main.scss          # all styles (BEM, SCSS variables)
├── types/
│   └── index.ts          # TypeScript interfaces
├── constants.ts           # default categories, formatting helpers
├── icons.tsx              # shared lucide-react icon set
├── categoryIcons.tsx      # icon picker resolver for expense categories
├── App.tsx                # main dashboard / add / history views
├── Landing.tsx            # marketing page + feature carousel (pre-login)
├── Auth.tsx               # login / register / reset-request screen
├── AuthLayout.tsx         # shared layout for auth screens
├── PasswordReset.tsx      # set-new-password screen (from email link)
├── Settings.tsx           # theme, language, categories, privacy policy, logout
├── CategoryManager.tsx     # add/edit/hide/delete expense categories
├── PrivacyPolicy.tsx       # in-app privacy policy
└── ErrorBoundary.tsx       # top-level crash fallback
```

## License

MIT © KacperDn
