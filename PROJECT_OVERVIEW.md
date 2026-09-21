# Finding MENA — Agency Connect Platform

Finding MENA is a B2B marketplace platform designed to connect clients with the best marketing, creative, and technology agencies across the MENA region (UAE, Saudi Arabia, Egypt, etc.).

## 🏗 Project Architecture

The project is a full-stack application split into a frontend (React/Vite) and a backend (Node.js/Express).

### 🎨 Frontend (`/src`)
Built with **React**, **TypeScript**, **Tailwind CSS**, and **TanStack Router**.

- **`/src/routes/`**: Contains the page components.
  - `index.tsx`: The landing page with high-conversion hero sections and featured agencies.
  - `agencies.index.tsx`: The searchable directory of all verified agencies.
  - `agencies.$slug.tsx`: Detailed public profiles for agencies (Portfolio, Reviews, Team).
  - `submit-project.tsx`: Multi-step intake form for clients to post new projects.
  - `agency-onboarding.tsx`: 4-step onboarding flow for newly registered agencies.
  - `agency-dashboard.tsx`: Private dashboard for agency owners to manage leads.
  - `client-dashboard.tsx`: Private dashboard for clients to track project matches.
  - `admin.tsx`: Master administrative panel for verifying agencies and managing plans.
- **`/src/lib/api.ts`**: The centralized API client using `fetch` with built-in authentication and cache-busting logic.
- **`/src/components/`**: Reusable UI components (Cards, Headers, Footers, etc.).

### ⚙️ Backend (`/server`)
Built with **Node.js**, **Express**, and **MongoDB (Mongoose)**.

- **`/server/src/models/`**: MongoDB schemas.
  - `User.js`: Unified user model (Client, Agency, Admin roles).
  - `Agency.js`: Profiles, services, portfolio, and plan status (Starter/Growth/Featured).
  - `Project.js`: Client project briefs and matching requirements.
  - `Lead.js`: The "bridge" between projects and agencies.
- **`/server/src/routes/`**: API endpoints.
  - `auth.js`: Registration/Login logic with auto-agency creation.
  - `agencies.js`: Public and private agency profile management.
  - `projects.js`: Project submission and the core matching engine logic.
  - `leads.js`: Lead lifecycle management (including self-healing logic for data integrity).
  - `admin.js`: Administrative routes for approvals and platform management.
- **`/server/src/middleware/auth.js`**: JWT-based authentication and role-based access control (RBAC).

## 🚀 Core Features

### 1. Matching Engine
When a client submits a project, the backend calculates a compatibility score (0-100) for every agency based on:
- **Service Overlap (50%)**: Matching selected services against agency expertise.
- **Budget Fit (25%)**: Comparing project budget to agency minimums.
- **Location (15%)**: Regional proximity (within MENA).
- **Industry Experience (10%)**: Matching industry-specific portfolio experience.

### 2. Agency Lifecycle
1. **Registration**: Agency creates an account.
2. **Onboarding**: Mandatory profile setup (Basics -> Recognition -> Services -> Portfolio).
3. **Approval**: Admin verifies the profile via the Admin Panel.
4. **Dashboard**: Agency receives "Leads" from matched projects. Starter plans have limited lead unlocks.

### 3. Lead Security & Privacy
- **Unverified Profiles**: Blocked from public view (404) until approved by Admin.
- **Encrypted Leads**: Contact details are locked for Starter plans until "unlocked."

## 🛠 Tech Stack
- **Frontend**: Vite, React 18, Tailwind CSS, TanStack Router.
- **Backend**: Node.js, Express, Mongoose, JWT, Zod.
- **Database**: MongoDB.

## 📝 Maintenance Notes
- **Self-Healing Leads**: The `GET /api/leads` route includes logic to automatically restore leads that might have been purged during database updates or matching recalibrations.
- **Caching**: The API client forces `no-cache` to ensure real-time status updates (e.g., when an admin approves an agency).
