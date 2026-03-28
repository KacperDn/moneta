# moneta 

Personal finance tracker — track your monthly expenses, visualize spending habits and monitor trends over time.

**[Live Demo →](https://kacperdn.github.io/moneta/)**


---

## Features

-  Monthly spending breakdown with donut chart
-  Multi-month trend chart with % change indicator
-  8 expense categories with daily bar chart
-  Email/password authentication with persistent sessions
-  Cloud database — data syncs across all devices
-  Mobile-first responsive design, installable as PWA

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styles | SCSS (BEM methodology) |
| Charts | Recharts |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT + RLS) |
| Hosting | GitHub Pages |

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

## Project Structure

```
src/
├── hooks/
│   ├── useAuth.ts        # session management
│   └── useExpenses.ts    # data fetching and mutations
├── styles/
│   └── main.scss         # all styles (BEM, SCSS variables)
├── types/
│   └── index.ts          # TypeScript interfaces
├── lib/
│   └── supabase.ts       # Supabase client
├── constants.ts          # categories, months, helpers
├── App.tsx               # main views
└── Auth.tsx              # login / register screen
```

## License

MIT © KacperDn