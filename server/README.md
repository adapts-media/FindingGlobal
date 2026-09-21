# Finding MENA — Backend (Express + MongoDB)

Self-contained MERN backend. Run locally alongside the Vite frontend.

## Prerequisites

- Node.js 20+
- MongoDB running locally (`mongodb://127.0.0.1:27017`) **or** a MongoDB Atlas URI

## Setup

```bash
cd server
cp .env.example .env       # then edit values
npm install
npm run seed               # seeds 9 agencies + admin@findingglobal.com / admin12345
npm run dev                # starts http://localhost:4000
```

## Environment variables (`server/.env`)

| Var | Example | Purpose |
|---|---|---|
| `PORT` | `4000` | API port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/finding-mena` | Mongo connection string |
| `JWT_SECRET` | long random string | Signs JWTs — **change this** |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `CORS_ORIGIN` | `http://localhost:3000` | Frontend origin (comma-separated for multiple) |

## Frontend `.env`

In the project root (next to `package.json`):

```
VITE_API_URL=http://localhost:4000/api
```

## Endpoints

### Auth
- `POST /api/auth/register` — `{ email, password, name, role?, company?, country? }`
- `POST /api/auth/login` — `{ email, password }` → `{ token, user }`
- `GET  /api/auth/me` — Bearer token → `{ user }`

### Agencies (public)
- `GET  /api/agencies?service=&country=&industry=&search=&featured=&limit=`
- `GET  /api/agencies/:slug`
- `POST /api/agencies/match` — `{ services, budget, country, industry, limit? }`
- `POST /api/agencies` — admin only
- `PATCH /api/agencies/:slug` — admin or agency

### Projects (auth)
- `GET  /api/projects` — own (client) or all (admin)
- `POST /api/projects` — client/admin, auto-runs matching + creates leads
- `GET  /api/projects/:id`

### Leads (agency/admin)
- `GET  /api/leads`
- `PATCH /api/leads/:id` — `{ status?, note? }`

## Auth header

`Authorization: Bearer <token>`

## Notes

- Passwords hashed with bcrypt (10 rounds).
- Input validated with Zod on auth + project creation.
- Matching scoring mirrors the frontend: services 50% / budget 25% / country 15% / industry 10%.
- This server is independent of the Vite/TanStack frontend — deploy it on any Node host (VPS, Render, Railway, Fly).