# moneta 

Personal finance tracker — track your monthly expenses, visualize spending habits and monitor trends over time.

**[Live Demo →](https://kacperdn.github.io/moneta/)**


---

## Features

-  Monthly spending breakdown with donut chart
-  Multi-month trend chart with % change indicator
-  8 expense categories with daily bar chart
-  Email/password authentication with persistent sessions, plus email-based password reset
-  Cloud database — data syncs across all devices
-  Mobile-first responsive design, installable as a PWA (works offline for the app shell)
-  Optional monthly budget goal with a live progress bar, synced via Supabase
-  Animated, split-screen auth experience with a rotating feature card stack
-  User-friendly error handling — backend/config errors never leak to the UI, with a top-level crash fallback
-  Toast notifications for every action (add/delete/errors)
-  CI/CD — every push to `main` is linted, built, and deployed automatically

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styles | SCSS (BEM methodology) |
| Charts | Recharts |
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

The `budgets` table (used for the monthly goal feature) is defined in [supabase-budgets-migration.sql](supabase-budgets-migration.sql) — run it once in the Supabase SQL Editor for a new project.

## Project Structure

```
src/
├── hooks/
│   ├── useAuth.ts        # session management
│   ├── useExpenses.ts    # data fetching and mutations
│   ├── useCountUp.ts     # animated number count-up
│   └── useBudgetGoal.ts  # monthly budget goal (Supabase)
├── lib/
│   ├── supabase.ts       # Supabase client
│   └── errors.ts         # maps Supabase errors to user-friendly messages
├── styles/
│   └── main.scss         # all styles (BEM, SCSS variables)
├── types/
│   └── index.ts          # TypeScript interfaces
├── constants.ts          # categories, months, helpers
├── icons.tsx             # shared inline SVG icon set
├── App.tsx               # main dashboard / add / history views
├── Auth.tsx              # login / register / reset-request screen
├── AuthLayout.tsx         # shared split-screen layout for auth screens
├── PasswordReset.tsx      # set-new-password screen (from email link)
└── ErrorBoundary.tsx      # top-level crash fallback
```

## License

MIT © KacperDn