# Library — a calm digital reading room

A web-first digital reading platform: clean, comfortable reading with strong
book discovery and regional-language (Assamese) support. Built as a real-user
portfolio project — a better, affordable, desktop-first alternative to the
Kindle experience.

> **Status: Phase 0 (foundation).** App shell, theming, auth and database are
> wired. Book discovery and the reader arrive in later phases.

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack), TypeScript
- **Styling:** Tailwind CSS v4, shadcn/ui (Radix), next-themes
- **Database:** Neon (serverless PostgreSQL) + Drizzle ORM
- **Auth:** Better Auth (email + password)

All infrastructure is ₹0/month (Vercel Hobby + Neon free tier).

## Project structure

```
src/
├── app/
│   ├── (app)/                 # Public browsing shell (header + footer)
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Home (Phase 0 placeholder)
│   │   ├── sign-in/page.tsx
│   │   └── register/page.tsx
│   ├── api/auth/[...all]/     # Better Auth route handler
│   ├── layout.tsx             # Root: fonts + theme provider
│   └── globals.css            # Design tokens + reading typography
├── components/
│   ├── ui/                    # shadcn/ui primitives
│   ├── theme-provider.tsx
│   ├── theme-toggle.tsx       # Light / Sepia / Dark
│   ├── site-header.tsx
│   └── auth/                  # Sign-in / register forms
├── db/
│   ├── index.ts               # Neon + Drizzle client
│   ├── schema.ts              # Application schema
│   └── auth-schema.ts         # Better Auth tables (generated)
├── auth.ts                    # Better Auth instance
└── lib/
    ├── auth-client.ts         # Client-side auth client
    └── session.ts             # Server-side session helper
```

The `(app)` route group keeps the reader chrome separate from the root layout,
so the full-screen distraction-free reader can later live outside the group.

## Database schema

Normalized, provider-agnostic book model (content is referenced, never stored):

- **user / session / account / verification** — Better Auth tables
- **books** — normalized catalog entry; `rights` (enum) gates content access
- **authors**, **book_authors** — many-to-many, ordered
- **genres**, **book_genres** — subject taxonomy for genre discovery
- **library_items** — a user's saved library
- **reading_progress** — cross-device position ("Continue Reading")
- **bookmarks**

`books.rights` is a PostgreSQL enum (`public_domain | cc | free | restricted`) —
a hard legal guardrail ensuring only legally distributable books can ever get a
working "Read" action.

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon serverless Postgres connection string |
| `BETTER_AUTH_SECRET` | Auth secret (hex, 32 bytes) — `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | Base URL (`http://localhost:3000` in dev) |
| `NEXT_PUBLIC_APP_URL` | Public base URL (`http://localhost:3000` in dev) |

## Local development

```bash
npm install
cp .env.example .env          # fill in real DATABASE_URL + secret
npm run dev
# open http://localhost:3000
```

Database commands:

```bash
npm run db:generate   # create migration SQL from schema
npm run db:migrate    # apply migrations to Neon
npm run db:push       # push schema directly (dev only)
npm run db:studio     # inspect the database
npm run auth:generate # regenerate Better Auth schema (after auth config changes)
```

Recommended flow: after creating a Neon project, set `DATABASE_URL` and run
`npm run db:generate && npm run db:migrate`.

## Verification (Phase 0)

- `npm run typecheck` — passes
- `npm run build` — passes
- `npm run dev` — `/`, `/sign-in`, `/register` render 200
- `GET /api/auth/get-session` — returns the session (or `null` when signed out /
  when the DB is not reachable, degrading gracefully)

Note: auth features require a reachable `DATABASE_URL`. Before that is set, the
app renders but returns a DB connection error on auth calls — this is expected,
not a code bug.

## Roadmap

- **Phase 1** – Book providers (Open Library, Gutenberg, Standard Ebooks) +
  normalized model + curated catalog seed
- **Phase 2** – Discovery (home, search by title/author/genre/language, details)
- **Phase 3** – Custom normalized reader (the core experience)
- **Phase 4** – Library + cross-device reading progress
- **Phase 5** – Assamese / regional-language polish
- **Phase 6** – Mobile polish + deploy + user feedback
