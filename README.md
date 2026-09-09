# HostelHub

A full-stack hostel management platform for university residences. Students
handle maintenance requests, buy and sell within the hostel, report lost items,
RSVP to events and vote on community polls. Staff verify residents, work the
ticket queue, moderate the community and broadcast safety alerts.

Built with Next.js 15, FastAPI and PostgreSQL 15.

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_15-316192?style=flat-square&logo=postgresql&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)

---

## Contents

- [What makes it interesting](#what-makes-it-interesting)
- [Features](#features)
- [Architecture](#architecture)
- [Offline-first reads](#offline-first-reads)
- [Guest mode](#guest-mode)
- [Database](#database)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Migrations](#migrations)
- [Testing](#testing)
- [API](#api)
- [Engineering docs](#engineering-docs)

---

## What makes it interesting

Two things beyond the usual CRUD.

**The frontend does not need the backend to be useful.** Reads go through a
cache-then-network layer backed by IndexedDB. A view paints from cache
immediately, revalidates in the background, and when the network fails it keeps
its data and says how old it is rather than showing an error. Losing your
connection stops being fatal, and a cold backend no longer means a blank app.

**Business rules live in the database, not the router.** Order placement with
quantity validation, self-order prevention, ticket notification fan-out and
auto-archiving of resolved items are PL/pgSQL functions and triggers. They hold
no matter which client writes the row.

---

## Features

| Module | What it does |
| :--- | :--- |
| **Overview** | Personal dashboard with live counts and recent activity |
| **Marketplace** | List items, browse, order, and manage orders as buyer or seller |
| **Maintenance** | Report repairs, track status, and (for staff) assign and resolve |
| **Lost & Found** | Post lost or found items, anonymously if preferred, and mark them resolved |
| **Events** | Browse upcoming events and RSVP |
| **Community** | Posts, likes, and polls with live results |
| **Guidebook** | Hostel rules, FAQs and emergency contacts |
| **Safety Alerts** | Staff broadcasts, shown as a banner across the app |
| **Notifications** | Ticket updates, order activity and post likes |
| **Admin** | Resident verification, ticket queue, community moderation, system settings |

### Demo access

Browse without an account using **Continue as guest** on the sign-in screen, or
use the seeded test user:

| Role | Email | Password |
| :--- | :--- | :--- |
| Student | `test@hostel.edu` | `test` |

---

## Architecture

Three tiers, no shared runtime.

```
Next.js 15 (App Router, client-rendered)
    |  axios, Bearer JWT
    v
FastAPI (async psycopg3 connection pool)
    |  parameterised SQL, PL/pgSQL
    v
PostgreSQL 15
```

The frontend is layered so that no view component talks to the network
directly:

```
components/           rendering and composition only
    |
hooks/                useResource and per-feature data hooks
    |
lib/offline/          cache-then-network resource layer, connectivity, IndexedDB
    |
lib/api.ts            axios, token refresh, endpoint wrappers
```

`lib/types/` holds one file per module mirroring the API response shapes, so a
field rename fails at build time rather than rendering `undefined` in
production.

Every API response uses the same envelope:

```json
{ "success": true, "data": {}, "message": "Listings retrieved" }
```

### Authentication

Access and refresh JWTs. The axios interceptor refreshes once on a `401`,
queues concurrent failures behind that refresh, and clears the session on
failure. Roles are enforced server-side by `require_admin`; the client-side
role read is presentation only.

---

## Offline-first reads

The rule the whole design hangs on: **a cache hit plus a network failure is not
an error state.**

1. Read cache synchronously. If present, paint it immediately as `ready`, with
   `isStale` set from its TTL. No spinner.
2. Fetch in the background.
3. On success, write the cache and swap in the fresh data.
4. On failure with cached data, keep the data and mark it stale.
5. On failure with nothing cached, that is the error state.

Connectivity is decided by a probe against `/health` with exponential backoff,
not by `navigator.onLine`, which reports true on a network with no route out.
When the backend is unreachable the app shows one banner saying how old the
data is, not one error per panel. Empty and error are different components:
"no listings yet" and "could not load listings" mean opposite things.

Polling is visibility-aware. Nothing revalidates while the tab is hidden.

### Cache scoping

Cache keys are namespaced, and that namespace is a security boundary:

```
guest:guidebook                    public, survives sign-out
user:42:notifications              personal, wiped on sign-out
user:42:marketplace:orders:mine
```

`signOut` clears the departing user's scope before dropping the identity. On a
shared hostel machine, skipping that step would show one student's orders to
the next person, so it is covered by tests and by a manual verification step.

Writes still require the network. Offline writes and a sync queue are
deliberately out of scope; conflict resolution against the PL/pgSQL invariants
is its own problem.

---

## Guest mode

A visitor with no account can browse the guidebook, events, safety alerts, lost
& found and marketplace listings. Tabs that need an account are hidden rather
than shown and then failing, and any write opens a prompt explaining what it
needs.

Public endpoints take an optional bearer token via `get_optional_user`.
Redaction happens in the `SELECT`, not by stripping keys from a dict
afterwards. Guests receive `seller_id`, `reporter` and `created_by` as
`NULL::int`, so listings cannot be used to enumerate residents.

`GET /api/v1/public/bootstrap` returns the guidebook, active alerts and
upcoming events in one response, so a cold guest load costs one round trip
rather than three.

Everything user-scoped stays behind `get_current_user` or `require_admin`.

---

## Database

Eighteen tables, seven functions, two procedures, six triggers and an explicit
cursor routine.

### Stored procedures

| Procedure | Purpose |
| :--- | :--- |
| `get_student_summary` | Aggregate dashboard counts in one round trip (OUT params) |
| `process_order_cancellation` | Cancel an order and roll inventory back |

### Functions

| Function | Returns | Purpose |
| :--- | :--- | :--- |
| `register_user` | `RECORD` | Create a user with hashed credentials and initial state |
| `place_order` | `RECORD` | Validate quantity, decrement stock, create the order |
| `update_ticket_status` | `BOOLEAN` | Transition a maintenance ticket |
| `cast_vote` | `RECORD` | Record a poll vote, one per user per poll |
| `get_poll_percentage` | `DECIMAL` | Live vote share for an option |
| `get_student_order_count` | `INTEGER` | Orders placed by a student |
| `is_item_archived` | `BOOLEAN` | Whether a lost & found item is archived |

### Triggers

| Trigger | Event | Purpose |
| :--- | :--- | :--- |
| `trg_prevent_self_order` | `BEFORE INSERT` | A seller cannot order their own listing |
| `trg_ticket_notification` | `AFTER UPDATE` | Status change notifies the reporter |
| `trg_notify_post_like` | `AFTER INSERT` | A like notifies the post author |
| `trg_auto_archive_items` | `BEFORE UPDATE` | Resolved lost & found items archive themselves |
| `trg_updated_at` | `BEFORE UPDATE` | Maintains `updated_at` |

### Cursor

`cur_overdue` walks unresolved tickets and items past their window and flags or
archives them in a scheduled maintenance routine.

---

## Project structure

```
hostel-hub/
├── app/                      Next.js App Router entry
├── components/
│   ├── auth/                 sign-in, registration, OTP
│   ├── dashboard/            one file per module, plus per-feature folders
│   ├── offline/              connection banner, resource states, sign-in prompt
│   └── ui/                   shared primitives
├── hooks/                    useResource and per-feature data hooks
├── lib/
│   ├── offline/              cache store, resource layer, connectivity
│   ├── session/              session modes and the write guard
│   ├── types/                API response types, one file per module
│   ├── api.ts                axios instance and endpoint wrappers
│   └── auth.ts               token handling
├── backend/
│   ├── auth/                 JWT, dependencies, router
│   ├── core/                 settings
│   ├── database/             connection pool
│   └── modules/              one package per domain, plus public/
├── database/
│   ├── hostelhub.sql         full build script
│   └── migrations/           numbered forward migrations
├── tests/                    Vitest suites
└── docs/                     engineering standards, ADRs, plans
```

---

## Getting started

**Prerequisites:** Node 20+, Python 3.11+, PostgreSQL 15+.

<details>
<summary><b>1. Database</b></summary>

```bash
createdb hostelhub
psql -U postgres -d hostelhub -f database/hostelhub.sql

# apply forward migrations in order
psql -U postgres -d hostelhub -f database/migrations/0001_add_pending_order_status.sql
```

Migration 0001 is required. Without it, placing a marketplace order fails at
the database level.

</details>

<details>
<summary><b>2. Backend</b></summary>

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
cp ../.env.example .env    # then fill in the backend values
uvicorn main:app --reload --port 8000
```

</details>

<details>
<summary><b>3. Frontend</b></summary>

```bash
npm install
cp .env.example .env.local  # then fill in NEXT_PUBLIC_API_URL
npm run dev
```

Open <http://localhost:3000>.

</details>

### Scripts

| Command | What it does |
| :--- | :--- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest, single run |
| `npm run test:watch` | Vitest in watch mode |

---

## Environment variables

`.env.example` documents every key. Nothing sensitive is committed.

### Frontend (`.env.local`)

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Backend base URL, e.g. `http://localhost:8000` |

### Backend (`backend/.env`)

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret. Generate with `openssl rand -hex 32` |
| `ALGORITHM` | JWT algorithm, `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime |
| `CORS_ORIGINS` | Comma-separated list of allowed origins |

---

## Migrations

`database/hostelhub.sql` builds a fresh database and stays authoritative for a
clean install. Every schema change after deployment also ships as a numbered
forward migration in `database/migrations/`, applied in order. Migrations are
never edited once applied; a correction is a new migration.

---

## Testing

```bash
npm test
```

Vitest with jsdom and `fake-indexeddb`, covering the layers that would fail
silently:

| Suite | What it protects |
| :--- | :--- |
| `store.test.ts` | TTL expiry, schema-version invalidation, and that clearing one user's scope leaves other users and public content intact |
| `resource.test.ts` | Cache paints before the network; a network failure with cache is stale rather than an error; request dedupe |
| `session.test.tsx` | All three session modes, the write guard's behaviour in each, and that sign-out wipes the cache scope before dropping the identity |
| `resource-states.test.tsx` | Loading, empty, error and stale render distinctly |
| `format.test.ts` | Relative timestamps |

---

## API

FastAPI serves interactive documentation at
<http://localhost:8000/docs> while the backend is running.

Routes are grouped under `/api/v1/<module>`: `auth`, `users`, `marketplace`,
`maintenance`, `polls`, `events`, `lost-found`, `guidebook`, `notifications`,
`safety-alerts`, `community`, `settings`, and `public`.

Readable without a token:

| Endpoint | Notes |
| :--- | :--- |
| `GET /api/v1/public/bootstrap` | Guidebook, active alerts and upcoming events in one call |
| `GET /api/v1/guidebook/` | Full entries |
| `GET /api/v1/events/` | Attendee counts only, no identities |
| `GET /api/v1/safety-alerts/` | Active alerts, author withheld |
| `GET /api/v1/lost-found/` | Reporter id withheld |
| `GET /api/v1/marketplace/listings` | Seller id withheld |

`GET /health` is unauthenticated and is what the client uses to decide whether
the backend is reachable.

---

## Engineering docs

`docs/` carries the standards this codebase is held to.

| Doc | Covers |
| :--- | :--- |
| `01-architecture.md` | How the tiers fit together, and an honest list of what is still weak |
| `02-frontend-standards.md` | TypeScript, component structure, data fetching, styling, accessibility |
| `03-backend-standards.md` | Response envelope, module layout, validation, SQL, errors |
| `04-database-standards.md` | Naming, where logic belongs, migrations, indexes |
| `05-security.md` | Auth model and known gaps, ranked |
| `06-git-workflow.md` | Branching, commits, review |
| `adr/` | Architecture decision records |
| `plans/` | Feature plans and implementation logs |

---

## License

MIT.
