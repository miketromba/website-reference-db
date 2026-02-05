# Website Reference DB — Project Specification

## Overview

A community platform for collecting and browsing links to websites that are inspirational from a design and copy perspective. Anyone can browse the global collection of references without signing in. Authenticated users can submit new references, manage their own collection, and upvote references they like. The core workflow is: find a website you like, paste its URL into a simple input bar, and instantly add it to the shared repository of design references. When seeking inspiration, visit this site, scroll through saved references (each with a visual screenshot preview), and click through to explore the original designs.

---

## Tech Stack

| Layer              | Technology                                                        |
| ------------------ | ----------------------------------------------------------------- |
| Language           | TypeScript                                                        |
| Runtime            | Bun                                                               |
| Frontend           | React (initialized via `bun create` with the React + Tailwind preset) |
| Styling            | Tailwind CSS                                                      |
| Icons              | Lucide React                                                      |
| Backend            | ElysiaJS                                                          |
| Monorepo           | TurboRepo                                                         |
| Database           | Supabase (Postgres) via the Supabase TypeScript SDK               |
| Linting/Formatting | Biome (configured to match internal Cursor Prettier settings)     |
| Pre-commit Hooks   | Husky (runs lint + test before every commit)                      |
| Deployment         | Vercel (subdomain: `website-refs`)                                |
| Screenshot Service | `@miketromba/screenshot-service` (deployed alongside on Vercel)   |

---

## Monorepo Structure (TurboRepo)

The repository uses TurboRepo to manage a monorepo with at least the following packages/apps:

- **apps/web** — The React frontend (initialized with Bun's React + Tailwind preset)
- **apps/api** — The ElysiaJS backend API server
- Root-level TurboRepo config (`turbo.json`), shared `tsconfig`, Biome config, Husky hooks, etc.

---

## Features

### 1. Browse References (Public — No Auth Required)

- The main page is **publicly accessible** without authentication.
- **Unauthenticated users** see a **global feed** of all references submitted by all users.
- **Authenticated users** see **only their own references** by default (with the option to switch to the global view).
- A scrollable grid/list of website references.
- Each reference displays:
  - A **screenshot preview** of the website (see Screenshot Service section below).
  - The website URL (clickable — opens the original site in a new tab).
  - An **upvote count** and upvote button.
- Sorted by most recently added (newest first).

### 2. Add a Website Reference (Auth Required)

- A persistent, always-visible input bar (at the top of the page or in a prominent location) where the user can paste a URL.
- **Requires authentication.** If an unauthenticated user tries to submit a URL, the auth overlay appears (see Authentication section).
- On submission, the URL is sent to the backend, validated, and stored in the database — associated with the authenticated user.
- Appropriate loading state while the request is in flight.
- Error feedback if the request fails (e.g., invalid URL, server error, duplicate URL).

### 3. Upvote a Reference (Auth Required)

- Each reference card displays an upvote button with the current upvote count.
- **Requires authentication.** If an unauthenticated user clicks the upvote button, the auth overlay appears.
- A user can upvote a reference once (toggle — clicking again removes the upvote).
- Upvote state is reflected immediately in the UI (optimistic update).

### 4. Screenshot Previews

- **Do NOT use iframes** — they are too heavy.
- Instead, use the screenshot service (`@miketromba/screenshot-service`) to generate screenshots of each saved website.
- The screenshot service will be deployed to Vercel alongside this project.
- Screenshots are **persisted in a Supabase Storage bucket** with a **2-week lifecycle** (see Screenshot Service section for full details).
- The frontend renders screenshots via an `<img>` tag pointing at a backend endpoint that handles the caching/serving logic.

### 5. Click to Visit

- Each reference card/item is clickable (or has a visible link) that opens the original website in a new tab.

---

## Screenshot Service

- Repository: [miketromba/screenshot-service](https://github.com/miketromba/screenshot-service)
- Package: `@miketromba/screenshot-service`
- Deployed to Vercel alongside this project (or as a separate Vercel project — whichever is simpler).

### Storage & Caching Strategy

Screenshots are stored in a **Supabase Storage bucket** (e.g., `screenshots`) and served through a backend endpoint with a just-in-time capture-and-cache pattern.

**Lifecycle: 2 weeks.**

#### Backend Screenshot Endpoint

The ElysiaJS API exposes an endpoint (e.g., `GET /api/screenshots/:websiteId`) that handles the full flow:

1. **Check Supabase Storage** for an existing screenshot for this website.
2. **If found and fresh** (stored less than 2 weeks ago based on stored metadata/timestamp):
   - Serve the image directly from storage.
   - Set response header: `Cache-Control: public, max-age=1209600, immutable` (2 weeks = 1,209,600 seconds).
3. **If not found or expired** (older than 2 weeks):
   - Call the screenshot service to capture a fresh screenshot of the website URL.
   - Upload the new screenshot to the Supabase Storage bucket (overwriting any expired version).
   - Store/update the capture timestamp (e.g., in the file metadata or in a column on the `websites` table).
   - Return the freshly captured image.
   - Set the same `Cache-Control: public, max-age=1209600, immutable` header.
4. The frontend simply uses `<img src="/api/screenshots/:websiteId">` — it never calls the screenshot service directly.

#### Supabase Storage Bucket

- Bucket name: `screenshots`
- Files named by website ID (e.g., `{website_id}.png`).
- Public or service-role access (the backend handles all reads/writes; the bucket does not need to be publicly accessible).

#### Freshness Tracking

- Add a `screenshot_captured_at` column (`timestamptz`, nullable) to the `websites` table.
- When a screenshot is captured and stored, update this column to `now()`.
- On the backend endpoint, compare `screenshot_captured_at` against `now() - interval '2 weeks'` to determine freshness.

---

## Authentication (Supabase Magic Link)

### Philosophy

Use Supabase's built-in Magic Link (passwordless email) authentication. No passwords, no OAuth providers — just enter your email, click the link sent to your inbox, and you're in.

### How It Works

1. **Frontend auth via Supabase client SDK:**
   - The frontend initializes a Supabase client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   - Supabase handles session persistence automatically (stored in `localStorage`).
2. **The site is publicly browsable without authentication.**
   - Unauthenticated users can browse the global feed and click through to websites freely.
   - No overlay or login prompt is shown on page load.
3. **Auth overlay (triggered on protected actions):**
   - When an unauthenticated user attempts a protected action (adding a reference, upvoting), a **blurred white overlay** appears on top of the website.
   - The overlay contains a simple email input field and a "Send Magic Link" button.
   - The overlay has an **X (close) button** so the user can dismiss it without authenticating.
   - On submit, the frontend calls `supabase.auth.signInWithOtp({ email })` to send a Magic Link.
   - A message tells the user to check their email.
   - When the user clicks the Magic Link, they are redirected back to the app and automatically signed in.
4. **Subsequent visits (already authenticated):**
   - Supabase automatically restores the session from `localStorage`. If a valid session exists, no overlay is triggered.
   - Session refresh is handled automatically by the Supabase SDK.
5. **Sign out:**
   - A simple sign-out button (e.g., in a corner or header) calls `supabase.auth.signOut()` and switches the view back to the global feed.
6. **Server-side verification:**
   - Protected API endpoints require the Supabase access token (JWT) as a `Bearer` token in the `Authorization` header.
   - Public endpoints (listing all references) do not require authentication.
   - The ElysiaJS backend verifies the JWT using the Supabase service role key or by calling `supabase.auth.getUser(token)` with the service-role client.
   - Returns `401 Unauthorized` if the token is missing, expired, or invalid on protected endpoints.

---

## User Feedback / UX

- **Loading states**: Show a loading indicator (spinner, skeleton, etc.) while any API request is in flight.
- **Error states**: Display clear error messages when requests fail (network error, invalid URL, auth failure, etc.).
- **Minimal and clean UI**: The design should be simple, elegant, and functional.

---

## Database (Supabase)

### Connection Details

All secrets and credentials are stored in the root `.env` file (see `.env` — git-ignored). The spec references them by variable name only.

| Property          | Env Variable                | Description                          |
| ----------------- | --------------------------- | ------------------------------------ |
| Project Dashboard | —                           | https://supabase.com/dashboard/project/siqvdvxdbzccsoqgwurm |
| Supabase URL      | `SUPABASE_URL`              | Supabase project API URL             |
| Connection String | `SUPABASE_DB_URL`           | Postgres pooler connection string    |
| Anon (Public) Key | `SUPABASE_ANON_KEY`         | Public/anon key for client-side use  |
| Service Role Key  | `SUPABASE_SERVICE_ROLE_KEY` | Privileged key for server-side use   |
| DB Password       | `SUPABASE_DB_PASSWORD`      | Postgres database password           |

### Schema

Use proper database migrations (via Supabase MCP or migration files).

**`websites` table:**

| Column       | Type                        | Description                                  |
| ------------ | --------------------------- | -------------------------------------------- |
| `id`         | `uuid` (PK, default gen)    | Unique identifier                            |
| `url`        | `text` (not null, unique)   | The website URL                              |
| `title`      | `text` (nullable)           | Optional title/label for the website         |
| `user_id`    | `uuid` (not null, FK)       | The Supabase auth user who added this reference |
| `screenshot_captured_at` | `timestamptz` (nullable) | When the screenshot was last captured/stored |
| `created_at` | `timestamptz` (default now) | When the reference was added                 |

**`upvotes` table:**

| Column       | Type                        | Description                                  |
| ------------ | --------------------------- | -------------------------------------------- |
| `id`         | `uuid` (PK, default gen)    | Unique identifier                            |
| `website_id` | `uuid` (not null, FK)       | References `websites.id`                     |
| `user_id`    | `uuid` (not null, FK)       | The Supabase auth user who upvoted           |
| `created_at` | `timestamptz` (default now) | When the upvote was cast                     |

- **Unique constraint** on `(website_id, user_id)` in the `upvotes` table — a user can only upvote a given reference once.

### Access Pattern

- Use the **Supabase TypeScript SDK** (`@supabase/supabase-js`) for all database operations.
- The backend (ElysiaJS) uses the **service role key** for server-side operations.
- The frontend uses the Supabase client SDK **only for authentication** (Magic Link sign-in, session management).
- All data operations (CRUD on websites) flow through the ElysiaJS API — the frontend does NOT query Supabase directly for data.

---

## Environment Variables

All environment variables are defined in the root `.env` file (git-ignored). See `.env` for actual values.

### Server Variables

| Variable                    | Description                                    |
| --------------------------- | ---------------------------------------------- |
| `SUPABASE_URL`              | Supabase project API URL                       |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged Supabase key for server-side ops    |
| `SUPABASE_DB_PASSWORD`      | Postgres database password                     |
| `SUPABASE_DB_URL`           | Postgres pooler connection string              |
| `SCREENSHOT_SERVICE_URL`    | URL of the deployed screenshot service         |

### Client Variables

| Variable               | Description                                        |
| ---------------------- | -------------------------------------------------- |
| `VITE_API_URL`         | URL of the deployed API                            |
| `VITE_SUPABASE_URL`    | Supabase project API URL (for client-side auth)    |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key (for client-side auth) |

---

## Linting & Formatting (Biome)

- Use Biome for both linting and formatting across the entire monorepo.
- The Biome config must match the internal Cursor Prettier config (consistent quote style, indentation, semicolons, trailing commas, etc.).
- Biome should be configured at the root of the monorepo.

---

## Pre-commit Hooks (Husky)

- Install Husky at the root of the monorepo.
- Configure a `pre-commit` hook that runs:
  1. `biome check` (lint + format check)
  2. `turbo test` (run all tests)
- Commits are blocked if either command fails.

---

## Development Workflow

- **Commit-based workflow**: Work is done in atomic, independently testable chunks following a tracer bullet pattern.
- **Unit tests**: Added wherever they make sense to verify correctness.
- **End-to-end verification**: Use the agent browser tool to visually verify that the UI works correctly in the browser before considering any chunk of work complete.
- **Orchestration**: The primary agent acts as a high-level manager/reviewer, delegating implementation work to sub-agents via the Task tool. Sub-agents use the default (high-intelligence) model — never the fast model.
- **Parallelism**: Where tasks are independent and won't interfere with each other in the codebase, run multiple sub-agents in parallel.

---

## Deployment

- **Platform**: Vercel
- **Subdomain**: `website-refs` (the hosted Vercel URL should be `website-refs.vercel.app` or similar)
- **Environment variables**: All required env vars must be set in the Vercel project settings.
- **Screenshot service**: Also deployed to Vercel (either as part of this project or as a separate Vercel deployment).
- Use the `vercel-deploy` skill/script for deployment.

---

## Summary of Key Decisions

1. **Screenshots over iframes** — lightweight, stored in Supabase Storage with a 2-week refresh cycle, browser-cached for 2 weeks via `Cache-Control` headers.
2. **Supabase Magic Link auth** — passwordless email login via Supabase, JWT verified server-side, no passwords or OAuth.
3. **Supabase SDK over raw SQL** — simpler, type-safe, managed.
4. **ElysiaJS over Express/Fastify** — modern, fast, Bun-native.
5. **Biome over ESLint/Prettier** — single tool for lint + format, fast.
6. **TurboRepo** — clean monorepo structure for frontend + backend.
