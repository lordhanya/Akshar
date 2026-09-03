<div align="center">

# Akshar

**A calm, free digital reading room.**

Discover and read legally distributable books in English, Assamese, and other regional languages — with a distraction-free reader built for deep reading.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/license-MIT-green)](#)

</div>

---

## Overview

Akshar is a web-first digital reading platform designed as a calm, affordable alternative to commercial e-readers. It combines strong book discovery with a custom reader experience, regional-language support (including Assamese), and a zero-cost infrastructure stack.

**All infrastructure runs on free tiers** — Vercel Hobby + Neon Postgres — making it deployable at ₹0/month.

## Features

### Discovery

- **Home page** with curated categories, language browsing, and recently added books
- **Full-text search** by title, author, or subject with filters for language, availability, and genre
- **Book detail pages** with cover, description, source attribution, and reading availability status

### Reader

- **Continuous scroll** — no pagination, no distraction
- **Three themes** — Light, Dark, and Sepia (warm paper tone)
- **Typography controls** — adjustable font size, line height, and reading width
- **Reading progress** — automatic position tracking with percentage indicator
- **Resume** — pick up where you left off (localStorage for anonymous, cross-device for authenticated users)
- **Keyboard navigation** — arrow keys to move between sections
- **Table of contents** — jump to any chapter from the sidebar

### Library

- **Save books** for quick access later
- **Personal library page** with saved books grid
- **"Continue Reading"** section on the home page (authenticated users)

### Regional Language Support

- **Assamese** (অসমীয়া) with dedicated Noto Serif Bengali typography
- Language-specific reading column styling
- Verified Assamese titles from curated sources

### Authentication

- Email + password sign-in via Better Auth
- Session persistence across devices
- Graceful degradation when signed out

## Screenshots

> _Screenshots coming soon._

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4, shadcn/ui (Radix) |
| **Themes** | next-themes (Light / Dark / Sepia) |
| **Database** | Neon (serverless PostgreSQL) + Drizzle ORM |
| **Auth** | Better Auth (email + password) |
| **Content** | Project Gutenberg, Open Library, Standard Ebooks |
| **Hosting** | Vercel (Hobby tier) |

## Project Structure

```
src/
├── app/
│   ├── (app)/                    # Public browsing shell
│   │   ├── page.tsx              # Home — discovery, search, categories
│   │   ├── books/[id]/page.tsx   # Book detail
│   │   ├── search/page.tsx       # Full-text search with filters
│   │   ├── library/page.tsx      # Saved books
│   │   ├── sign-in/page.tsx      # Authentication
│   │   └── register/page.tsx     # Registration
│   ├── (reader)/                 # Distraction-free reader shell
│   │   └── books/[id]/read/      # Continuous-scroll reader
│   ├── api/auth/[...all]/        # Better Auth route handler
│   ├── layout.tsx                # Root: fonts + theme provider
│   └── globals.css               # Design tokens + reading typography
├── components/
│   ├── reader/                   # Reader UI (settings, section nav)
│   ├── ui/                       # shadcn/ui primitives
│   ├── book-card.tsx             # Book grid card
│   ├── book-cover.tsx            # Cover with fallback
│   ├── search-bar.tsx            # Debounced search input
│   ├── filter-panel.tsx          # Language + availability filters
│   └── site-header.tsx           # Global navigation
├── db/
│   ├── schema.ts                 # Application schema (books, library, progress)
│   └── auth-schema.ts            # Better Auth tables
├── lib/
│   ├── books.ts                  # Catalog queries
│   ├── reader/                   # Reader logic (load, progress, sanitize, settings)
│   └── session.ts                # Server-side session helper
├── providers/
│   ├── gutenberg/                # Project Gutenberg adapter
│   ├── openlibrary/              # Open Library adapter
│   └── standard-ebooks/          # Standard Ebooks adapter
└── seed/                         # Catalog seeding scripts
```

## Database Schema

Normalized, provider-agnostic book model:

- **books** — catalog entry with `rights` enum gating content access
- **authors / book_authors** — many-to-many, ordered
- **genres / book_genres** — subject taxonomy for genre discovery
- **book_content** — cached full text (sections + paragraphs)
- **library_items** — user's saved books
- **reading_progress** — cross-device position tracking
- **bookmarks** — user annotations

`books.rights` is a PostgreSQL enum (`public_domain | cc | free | restricted`) — a hard legal guardrail ensuring only legally distributable books can ever reach the reader.

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) account (free tier)
- A [Vercel](https://vercel.com) account (optional, for deployment)

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/akshar.git
cd akshar

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and BETTER_AUTH_SECRET

# Generate and run migrations
npm run db:generate
npm run db:migrate

# Seed the catalogue (10 public domain books)
npm run db:seed

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon serverless Postgres connection string |
| `DATABASE_URL_UNPOOLED` | Direct connection (for migrations) |
| `BETTER_AUTH_SECRET` | Auth secret — `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | Base URL (`http://localhost:3000` in dev) |
| `APP_BASE_URL` | Base URL |

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type checking |
| `npm run test` | Run test suite (Vitest) |
| `npm run db:generate` | Generate migration SQL |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema directly (dev) |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Seed the book catalogue |
| `npm run db:seed:content` | Fetch and cache book content |

## Roadmap

- [x] **Phase 0** — Foundation: app shell, theming, auth, database
- [x] **Phase 1** — Book providers (Gutenberg, Open Library, Standard Ebooks) + normalized model + curated seed
- [x] **Phase 2** — Discovery: home page, search, filters, book details
- [x] **Phase 3** — Custom reader: continuous scroll, themes, typography, progress, resume, chapter nav
- [ ] **Phase 4** — Library + cross-device reading progress
- [ ] **Phase 5** — Assamese / regional-language polish
- [ ] **Phase 6** — Mobile polish + deploy + user feedback

## Design Principles

- **Calm, not commercial** — no ads, no upsells, no infinite scroll
- **Reader-first** — the reading experience is the product, not a feature
- **Legally clean** — hard guardrails ensure only freely distributable content is readable
- **Zero-cost infrastructure** — free tiers for everything, deployable by anyone
- **Regional by default** — Assamese and other Indian languages are first-class citizens

## Author

**Ashif Rahman** — [@ashifcodes](https://instagram.com/ashifcodes) · [ashifcodes.tech](https://ashifcodes.tech)

Created and developed with care.

## License

MIT
