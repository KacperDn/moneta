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
| Frontend | React 18, Vite |
| Styles | SCSS (BEM methodology) |
| Charts | Recharts |
| Backend | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT + RLS) |
| Hosting | GitHub Pages |

## Architecture

```
Browser (React)
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
├── App.jsx           # main app logic and views
├── Auth.jsx          # login / register screen
├── supabase.js       # supabase client config
└── styles/
    └── main.scss     # all styles (BEM, SCSS variables)
```

## Getting Started

### Prerequisites
- Node.js v20+
- A [Supabase](https://supabase.com) account (free tier)

### Installation

```bash
git clone https://github.com/kacperdn/moneta.git
cd moneta
npm install
```

### Environment variables

Create a `.env` file in the root directory:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_KEY=your_supabase_publishable_key
```

### Database setup

Run this SQL in your Supabase SQL Editor:

```sql
create table expenses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  description text not null,
  cat text not null,
  amount numeric(10,2) not null,
  date date not null,
  user_id uuid references auth.users(id)
);

alter table expenses enable row level security;

create policy "own data only"
on expenses for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

### Run locally

```bash
npm run dev
```

### Deploy to GitHub Pages

```bash
npm run build
npm run deploy
```

## License

MIT © KacperDn