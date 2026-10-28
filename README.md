# TMCC Views Monitoring

A Vercel-ready Next.js app with separate admin workspaces, Neon PostgreSQL shared storage, unique public Lokal pages, and separate page-visit/video-engagement metrics.

## What is included

- Admin sign-up, sign-in, and sign-out
- Password hashing and HTTP-only signed session cookies
- Account-specific Lokal ownership enforced in server-side queries
- Create, edit, delete Lokals and assign YouTube videos
- Unique public URLs such as `/lokal/lokal-name-a1b2c3`
- Page visit, player play, 25/50/75% progress, and completion event tracking
- Responsive dashboard and per-Lokal counts
- Neon PostgreSQL schema

## Important measurement note

Page visits and YouTube embedded-player events are engagement metrics. They are not official YouTube Analytics views, do not prove that a person watched the entire video, and do not guarantee a count of unique people. Browser IDs are approximate and can be cleared or changed. The embedded player API reports state changes; progress milestones are checked when playback state changes, so they are approximate rather than second-by-second analytics.

## 1. Create the Neon database

1. Create a project at https://neon.tech.
2. Copy the PostgreSQL connection string from the Neon dashboard.
3. Open the Neon SQL Editor and run all of `schema.sql`.

## 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

- `DATABASE_URL`: Neon pooled or direct PostgreSQL connection string
- `SESSION_SECRET`: a random secret of at least 32 characters
- `NEXT_PUBLIC_SITE_URL`: `http://localhost:3000` locally; set to your deployed URL in Vercel

Generate a secret locally with `openssl rand -base64 32` or another secure random generator. Do not commit `.env.local` or expose `DATABASE_URL` in client-side code.

## 3. Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Create an admin account and add a Lokal with a YouTube URL.

## 4. Deploy to Vercel

1. Upload this project to a new GitHub repository. Do not upload `.env.local`.
2. In Vercel, import that repository.
3. Add `DATABASE_URL`, `SESSION_SECRET`, and `NEXT_PUBLIC_SITE_URL` under Project Settings → Environment Variables for Production, Preview, and Development as appropriate.
4. Deploy. If you update environment variables, redeploy.
5. Open the deployed site, create your admin account, add Lokals, and copy their public links.

Vercel deployment does not create the Neon database automatically; the SQL schema and environment variables must be configured first.

## Data separation

Every Lokal row has an `admin_id`. Dashboard, edit, and delete operations require a valid session and filter records by that account ID. Public Lokal routes only expose the public page fields. Keep the database URL and session secret server-side.

## Current limitations / production hardening

- Public tracking endpoints are unauthenticated by design. Before a high-traffic production launch, add rate limiting and abuse controls.
- A person may visit repeatedly or use multiple browsers/devices; visitor IDs are estimates, not verified identities.
- YouTube videos must allow embedding for the player to work.
- Sign-up is open to anyone who can reach the site. If account creation should be invite-only, add an invitation or owner approval process before launch.
- This starter does not claim or display official YouTube view counts.
Deployment update
