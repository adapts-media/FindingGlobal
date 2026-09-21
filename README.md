# Finding MENA — Full Project Documentation

> The authoritative agency procurement network for the Middle East & North Africa

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Goals & Mission](#2-goals--mission)
3. [Tech Stack](#3-tech-stack)
4. [Architecture](#4-architecture)
5. [User Roles](#5-user-roles)
6. [Features by Role](#6-features-by-role)
7. [Database Models](#7-database-models)
8. [API Reference](#8-api-reference)
9. [Frontend Routes](#9-frontend-routes)
10. [Local Development Setup](#10-local-development-setup)
11. [Production Deployment](#11-production-deployment)
12. [Environment Variables](#12-environment-variables)
13. [Matching Engine](#13-matching-engine)
14. [Lead Lifecycle](#14-lead-lifecycle)
15. [Agency Plans & Monetization](#15-agency-plans--monetization)
16. [User Guide (Platform Manual)](#16-user-guide-platform-manual)

---

## 1. Project Overview

**Finding MENA** is a full-stack B2B marketplace that connects businesses (clients) with vetted marketing, branding, technology, and consulting agencies across the Middle East and North Africa (MENA) region.

Clients submit a project brief in ~3 minutes describing their needs, budget, timeline, and market. The platform's matching engine then automatically selects the most relevant agencies from the database and notifies them. Agencies can view the lead, respond, and schedule meetings with the client — all within the platform.

**Live URLs:**
- **Frontend (Vercel):** `https://mena-agency-connect.vercel.app`
- **Backend API (Render):** `https://mena-backend-5wjw.onrender.com`

---

## 2. Goals & Mission

| Goal | Description |
|------|-------------|
| **Procurement speed** | Match businesses with relevant agencies in under 24 hours |
| **Quality assurance** | Only vetted, verified agencies appear in results |
| **Transparency** | Clients see agency portfolios, team, and reviews before committing |
| **Regional focus** | 100% focused on MENA — UAE, Saudi Arabia, Egypt, Qatar, and more |
| **Meeting facilitation** | Built-in Calendly integration so clients can book calls directly |

---

## 3. Tech Stack

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Router | TanStack Router v1 (file-based routing) |
| Styling | Tailwind CSS v4 + custom design tokens |
| Icons | Lucide React |
| Build tool | Vite 7 |
| Deployment | Vercel |

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 (ES Modules) |
| Framework | Express.js |
| Database | MongoDB + Mongoose ODM |
| Auth | JWT (JSON Web Tokens) |
| Deployment | Render |
| Database Host | MongoDB Atlas |

---

## 4. Architecture

```
┌─────────────────────────────────────────────┐
│              CLIENT BROWSER                 │
│         (React SPA on Vercel)               │
└──────────────────┬──────────────────────────┘
                   │ HTTPS (fetch API)
                   │ VITE_API_URL
                   ▼
┌─────────────────────────────────────────────┐
│           EXPRESS REST API                  │
│         (Node.js on Render)                 │
│                                             │
│  /api/health      /api/auth                 │
│  /api/agencies    /api/projects             │
│  /api/leads       /api/portfolio            │
│  /api/admin                                 │
└──────────────────┬──────────────────────────┘
                   │ Mongoose
                   ▼
┌─────────────────────────────────────────────┐
│           MONGODB ATLAS                     │
│   Collections: users, agencies,             │
│   projects, leads                           │
└─────────────────────────────────────────────┘
```

**Key architectural decisions:**
- **Stateless JWT auth** — tokens stored in `localStorage`, sent as `Authorization: Bearer <token>` on every request
- **CORS controlled** — backend only accepts requests from the configured `CORS_ORIGIN` domain
- **SPA routing** — `vercel.json` rewrites all routes to `index.html` so TanStack Router handles navigation client-side

---

## 5. User Roles

There are **3 user roles** in the system:

| Role | Description | Access |
|------|-------------|--------|
| `client` | Business looking to hire an agency | Submit briefs, view matched agencies, track projects, book meetings |
| `agency` | Agency looking for new business | View leads, respond to clients, manage profile & portfolio |
| `admin` | Platform administrator | Manage all users, agencies, projects, and leads |

---

## 6. Features by Role

### 👤 Client

1. **Submit a Project Brief** (`/submit-project`)
   - 5-step wizard: Services → Budget & Timeline → Market → Your Details → Review
   - Selects services needed (Marketing, Branding, Web Dev, etc.)
   - Sets budget tier (e.g. $25k–$75k)
   - Picks MENA country and industry
   - System runs matching engine on submission

2. **Client Dashboard** (`/dashboard`)
   - View all submitted projects
   - See status of each project (matched agencies count)
   - Click into a project for full detail

3. **Project Detail Page** (`/projects/:id`)
   - See all matched agencies for the project
   - View agency profile cards
   - **Schedule a Call** button — opens agency's Calendly link
   - **Contact Agency** fallback (email link) if no Calendly set
   - Track lead status (New → In Conversation → Won/Lost)
   - Edit project brief (title, description, budget, services)

---

### 🏢 Agency

1. **Agency Onboarding** (`/agency-onboarding`)
   - New agencies complete a full profile after first login
   - Fields: name, tagline, description, city, country, services, industries, team size, min budget, Calendly link

2. **Agency Dashboard** (`/agency-dashboard`)
   - View all incoming leads (project briefs from clients)
   - See lead status for each
   - Unlock leads (costs 1 lead credit from their plan allowance)
   - View full project brief after unlocking
   - Update lead status (New → Quoted → In Conversation → Won → Lost)
   - Add notes to leads

3. **Agency Public Profile** (`/agencies/:slug`)
   - Publicly visible profile page
   - Shows portfolio, team members, reviews, awards, client list
   - Clients can contact the agency via email

4. **Portfolio** (`/portfolio`)
   - Browse all agencies' portfolio items

---

### 🔐 Admin

1. **Admin Dashboard** (`/admin`)
   - **Users tab:** View all users, change roles, delete users
   - **Agencies tab:** View all agencies, toggle featured/verified status, delete agencies
   - **Projects tab:** View all projects with matched agency counts
   - **Leads tab:** View all leads, see status, unlock status, meeting status

---

## 7. Database Models

### User
```js
{
  email: String (unique),
  password: String (bcrypt hashed),
  name: String,
  role: "client" | "agency" | "admin",
  company: String,
  country: String,
  agencySlug: String  // links agency users to their agency profile
}
```

### Agency
```js
{
  slug: String (unique URL identifier),
  name: String,
  tagline: String,
  description: String,
  city: String,
  country: String,
  countryCode: String,
  founded: Number,
  teamSize: String,
  minBudget: Number,
  rating: Number,
  reviewCount: Number,
  services: [String],
  industries: [String],
  featured: Boolean,
  verified: Boolean,
  plan: "Starter" | "Growth" | "Featured",
  leadsUsed: Number,
  leadsLimit: Number,
  calendlyLink: String,         // for client meeting booking
  ownerUserId: ObjectId → User,
  portfolio: [PortfolioItem],
  team: [TeamMember],
  reviews: [Review],
  awards: [Award],
  clients: [Client],
  messages: [ContactMessage]
}
```

### Project
```js
{
  title: String,
  description: String,
  services: [String],
  budget: String,
  country: String,
  industry: String,
  status: "open" | "closed",
  clientId: ObjectId → User,
  matchedAgencies: [ObjectId → Agency]
}
```

### Lead
```js
{
  project: ObjectId → Project,
  agency: ObjectId → Agency,
  status: "New" | "Quoted" | "In Conversation" | "Won" | "Lost",
  note: String,
  unlocked: Boolean,
  meetingRequested: Boolean,
  meetingBooked: Boolean
}
```

---

## 8. API Reference

**Base URL:** `https://mena-backend-5wjw.onrender.com/api`

### Auth (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | None | Health check |
| POST | `/auth/register` | None | Register new user |
| POST | `/auth/login` | None | Login, returns JWT |
| GET | `/auth/me` | JWT | Get current user |

### Agencies (`/api/agencies`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/agencies` | None | List all agencies (with filters) |
| GET | `/agencies/:slug` | None | Get single agency by slug |
| POST | `/agencies` | JWT (agency) | Create agency profile |
| PATCH | `/agencies/:slug` | JWT (agency/admin) | Update agency |
| DELETE | `/agencies/:slug` | JWT (admin) | Delete agency |

### Projects (`/api/projects`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/projects` | JWT | List user's projects |
| POST | `/projects` | JWT (client) | Create project + run matching |
| GET | `/projects/:id` | JWT | Get project with leads |
| PATCH | `/projects/:id` | JWT (client) | Update project brief |

### Leads (`/api/leads`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/leads` | JWT (agency) | Get agency's leads |
| POST | `/leads/:id/unlock` | JWT (agency) | Unlock a lead |
| PATCH | `/leads/:id` | JWT (agency/client) | Update lead status/note |

### Portfolio (`/api/portfolio`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/portfolio` | None | Get all portfolio items |
| GET | `/portfolio/:agencySlug/:itemSlug` | None | Get single portfolio item |

### Admin (`/api/admin`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/users` | JWT (admin) | List all users |
| PATCH | `/admin/users/:id` | JWT (admin) | Update user |
| DELETE | `/admin/users/:id` | JWT (admin) | Delete user |
| GET | `/admin/agencies` | JWT (admin) | List all agencies |
| PATCH | `/admin/agencies/:id` | JWT (admin) | Update any agency |
| DELETE | `/admin/agencies/:slug` | JWT (admin) | Delete agency |
| GET | `/admin/projects` | JWT (admin) | List all projects |
| GET | `/admin/leads` | JWT (admin) | List all leads |

---

## 9. Frontend Routes

| Route | Page | Access |
|-------|------|--------|
| `/` | Homepage | Public |
| `/agencies` | Agency directory | Public |
| `/agencies/:slug` | Agency profile | Public |
| `/portfolio` | Portfolio gallery | Public |
| `/portfolio/:agencySlug/:itemSlug` | Portfolio item detail | Public |
| `/blog` | Blog / resources | Public |
| `/for-agencies` | Agency marketing page | Public |
| `/login` | Sign in / Create account | Public |
| `/submit-project` | Submit project brief | Authenticated (client) |
| `/dashboard` | Client project list | Authenticated (client) |
| `/projects/:id` | Project detail & leads | Authenticated (client) |
| `/agency-onboarding` | Agency profile setup | Authenticated (agency) |
| `/agency-dashboard` | Agency leads inbox | Authenticated (agency) |
| `/leads/:id` | Lead detail | Authenticated (agency) |
| `/admin` | Admin dashboard | Authenticated (admin) |
| `/upgrade` | Agency plan upgrade | Authenticated (agency) |

---

## 10. Local Development Setup

### Prerequisites
- Node.js 20+
- MongoDB running locally OR a MongoDB Atlas connection string

### 1. Clone the repository
```bash
git clone https://github.com/nitishbhardwaj-7/mena-agency-connect.git
cd mena-agency-connect
```

### 2. Install frontend dependencies
```bash
npm install
```

### 3. Install backend dependencies
```bash
cd server
npm install
cd ..
```

### 4. Configure environment (optional for local)
Create `.env.local` in the root:
```env
VITE_API_URL=http://localhost:4000/api
```

Create `server/.env`:
```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/finding-mena
JWT_SECRET=any-random-string-here
CORS_ORIGIN=http://localhost:5173
```

### 5. Start the backend
```bash
cd server
npm run dev
```
Backend starts at `http://localhost:4000`

### 6. Start the frontend (new terminal)
```bash
npm run dev
```
Frontend starts at `http://localhost:5173`

---

## 11. Production Deployment

| Setting | Value |
|---------|-------|
| Service type | Web Service |
| Runtime | Node.js |
| Root directory | `server/` |
| Build command | `npm install` |
| Start command | `node src/index.js` |
| Node version | 20.0.0 |


## 12. Environment Variables

### Frontend (Vite)
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | Auto-detected | Full URL to the Express API including `/api` |

### Backend (Express)
| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `PORT` | `4000` | No | Port to listen on |
| `MONGODB_URI` | `mongodb://127.0.0.1/finding-mena` | **Yes (prod)** | MongoDB connection string |
| `JWT_SECRET` | — | **Yes** | Secret key for signing JWT tokens |
| `CORS_ORIGIN` | `http://localhost:3000` | **Yes (prod)** | Allowed frontend origin (no trailing slash) |
| `NODE_VERSION` | — | No | Pins Node.js version on Render |

---

## 13. Matching Engine

When a client submits a project brief, the backend runs a **weighted matching algorithm** to find the most relevant agencies.

### Scoring Formula
| Factor | Weight | Logic |
|--------|--------|-------|
| **Services** | 50% | Agency's services overlap with requested services |
| **Budget** | 25% | Agency's `minBudget` is within or below the client's budget tier |
| **Country** | 15% | Agency's country matches the client's target market |
| **Industry** | 10% | Agency's industries include the client's industry |

The top-scoring agencies (up to 10) are stored in `project.matchedAgencies` and immediately visible to the client.

---

## 14. Lead Lifecycle

```
Brief Submitted
      │
      ▼
[Lead Created] ── status: "New" ── unlocked: false
      │
      ▼ Agency views lead in dashboard
[Lead Unlocked] ── unlocked: true ── uses 1 lead credit
      │
      ▼ Agency responds
      ├── status: "Quoted"
      ├── status: "In Conversation"
      │         │
      │         ▼ Client clicks "Schedule a Call"
      │   [Meeting Booked] ── meetingBooked: true
      │         │
      ▼         ▼
      └── status: "Won" or "Lost"
```

### Lead Credit System
- Each agency has a `leadsLimit` (default: 3 on Starter plan)
- Every time an agency unlocks a lead, `leadsUsed` increments
- When `leadsUsed >= leadsLimit`, the agency must upgrade their plan
- Admins can manually adjust limits

---

## 15. Agency Plans & Monetization

| Plan | Lead Credits | Features |
|------|-------------|---------|
| **Starter** | 3 leads/month | Basic profile, respond to leads |
| **Growth** | 15 leads/month | Full profile, portfolio, priority listing |
| **Featured** | Unlimited | Homepage featured placement, verified badge, all features |

> The `/upgrade` page presents the plan options. Actual payment processing is not yet implemented — this is a UI placeholder for a future Stripe integration.

---

## 16. User Guide (Platform Manual)

This section explains how to use the platform depending on your role.

### 👤 For Clients (Businesses seeking agencies)

1.  **Register & Login**: Create a client account to save your projects and track matches.
2.  **Submit a Brief**: Click **"Find an Agency"** from the homepage. Complete the multi-step intake form detailing your requirements, budget, and timeline.
3.  **Instant Matching**: Once submitted, navigate to your **Project Dashboard**. Our matching engine will instantly display the top 5 compatible agencies.
4.  **Review & Shortlist**: Click on agency profiles to view their **Portfolio**, **Team**, and **Reviews**.
5.  **Connect**: Use the **"Schedule a Call"** button on the agency's card to book a discovery meeting via their integrated Calendly link.

### 🏢 For Agencies (Creative & Tech firms)

1.  **Register**: Create an account and select the **Agency** role.
2.  **Mandatory Onboarding**: You must complete the 4-step onboarding process:
    *   **Basics**: Agency name, logo, location, and bio.
    *   **Recognition**: Awards, certifications, and media mentions.
    *   **Services**: Selection of your primary and secondary expertise.
    *   **Portfolio**: Case studies with images and descriptions.
3.  **Approval Queue**: Your profile remains private (returns 404) until verified by an Administrator. You will receive an email once approved.
4.  **Lead Inbox**: Check your **Agency Dashboard** regularly. New matched projects will appear here as "Leads."
5.  **Unlock Contact Info**: Click **"Unlock Lead"** to see the client's contact information. This uses 1 lead credit from your monthly plan.
6.  **Manage Lifecycle**: Update your lead status (Quoted, In Conversation, Won, Lost) to keep your sales pipeline organized.

---

## Appendix: Key Files

| File | Purpose |
|------|---------|
| `src/lib/api.ts` | All frontend API calls, base URL config, auth token management |
| `src/lib/auth-context.tsx` | React context for global auth state (user, login, logout) |
| `src/routes/__root.tsx` | Root layout — wraps all pages in `AuthProvider` |
| `src/routes/index.tsx` | Homepage |
| `src/routes/submit-project.tsx` | Multi-step project brief form |
| `src/routes/projects.$id.tsx` | Project detail + lead management for clients |
| `src/routes/agency-dashboard.tsx` | Lead inbox for agencies |
| `server/src/index.js` | Express app setup, CORS, routes, DB connection |
| `server/src/models/` | Mongoose schemas (User, Agency, Project, Lead) |
| `server/src/routes/` | Express route handlers (auth, agencies, projects, leads, admin) |
| `vite.config.ts` | Vite config with TanStack Router plugin, Tailwind, path aliases |
| `vercel.json` | SPA rewrite rules for Vercel deployment |
