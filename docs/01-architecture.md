# Architecture

## Shape of the system

Three tiers, no shared runtime:

```
Next.js 15 (App Router, client-rendered)
        |  axios, Bearer JWT
        v
FastAPI (Python 3.13, async psycopg3 pool)
        |  raw SQL + PL/pgSQL
        v
PostgreSQL 15 (functions, procedures, triggers, cursors)
```

The Next.js app is a single route (`app/page.tsx`) that swaps between three
views in local state: splash, login, dashboard. There is no router-level
navigation, no server components doing data work, and no server-side data
fetching at all. Every byte of application data arrives in the browser from
`lib/api.ts` after mount.

### Frontend layout

| Path | Role |
| :-- | :-- |
| `app/page.tsx` | View state machine (splash / login / dashboard) plus the maintenance-mode gate |
| `app/layout.tsx` | Root HTML, Inter font, global CSS |
| `components/splash-screen.tsx` | Intro animation |
| `components/auth/login-form.tsx` | Login, register, OTP verification |
| `components/dashboard/dashboard-view.tsx` | Shell: sidebar, tab switching, notification polling, toast host, safety-alert banner |
| `components/dashboard/*-view.tsx` | One file per module, each self-fetching |
| `lib/api.ts` | Axios instance, 401 refresh interceptor, all endpoint wrappers |
| `lib/auth.ts` | localStorage token read/write, JWT decode via `atob`, expiry check |
| `lib/utils.ts` | `cn()` class merge |
| `hooks/use-mobile.ts` | Viewport breakpoint hook |

Design language is hand-rolled Tailwind with a fixed warm palette
(`#FAF9F6` ground, `#4D5D53` ink, `#D4A373` accent). CSS variables exist in
`app/globals.css` but most components hardcode hex values instead.

### Backend layout

`backend/main.py` mounts one router per module under `/api/v1/<module>`.
Auth lives in `backend/auth/` (router, JWT utils, `get_current_user` and
`require_admin` dependencies). `backend/database/connection.py` opens an
`AsyncConnectionPool` on lifespan startup and hands it to routes through
`Depends(get_db_pool)`. There is no ORM and no service layer: routers hold
the SQL.

### Database

`database/hostelhub.sql` is a single idempotent-ish setup script: 18 tables,
7 functions, 2 procedures, 6 triggers, 1 explicit cursor routine, plus seed
data. Business rules that matter (self-order prevention, ticket notification
fan-out, auto-archiving of resolved lost-and-found items, order placement
with quantity validation) live in PL/pgSQL, not Python. That was a deliberate
course requirement and it is worth preserving: the database is the source of
truth for invariants.

## Authentication model

Access token (JWT) plus refresh token, both in `localStorage` under
`hh_access_token` / `hh_refresh_token`. `lib/auth.ts` decodes the payload
client-side to read `user_id`, `email` and `role`, and drives UI gating from
that. The axios response interceptor catches a `401`, calls
`/api/v1/auth/refresh` once, queues concurrent failures, and on failure clears
both tokens and hard-redirects to `/`.

Role is read from the token client-side for rendering, and enforced
server-side by `require_admin`. That split is correct; the client-side read is
presentation only.

## Current weaknesses

These are the things a new contributor should know before touching anything.

**1. The app is unusable without a live backend.** Every view mounts, fires a
request, and renders an error or an infinite spinner if the request fails.
There is no cache, no fallback content, no read-only mode. This is what the
offline plan in `plans/offline-first-guest-mode.md` addresses.

**2. Every endpoint requires a bearer token.** Even fully public content -
guidebook entries, events, safety alerts - sits behind `get_current_user`.
There is no anonymous read path at all.

**3. `any` is everywhere.** `useState<any[]>([])` is the norm across all
fifteen view components. There are no shared domain types, so a backend field
rename fails silently at runtime instead of loudly at build time.

**4. Duplicated fetch logic.** Each view repeats the same
`setLoading / try / await api / if (res.data.success) / catch / finally`
block, with slightly different error handling each time. Roughly 90 call sites.

**5. Polling instead of push.** `dashboard-view.tsx` polls notifications every
30s and safety alerts every 60s with `setInterval`, unconditionally, whether
or not the tab is visible.

**6. Component files are too large.** `admin-community-view.tsx` is 1022
lines with 28 `useState` calls; `marketplace-view.tsx` is 798 with 22.
Modals, forms, cards and data fetching all live in one file.

**7. No test suite, no CI.** Nothing runs on push. `next.config.ts` also sets
`eslint.ignoreDuringBuilds: true`, so lint failures do not block a build.

**8. Contract drift already exists.** `app/page.tsx` reads
`data.data.maintenance_mode` from `GET /api/v1/settings/maintenance`, but the
endpoint returns `data.enabled`. Maintenance mode therefore never triggers on
the client. This is exactly the class of bug shared types would have caught.

**9. CORS is pinned to one origin.** `allow_origins` is the single Vercel URL,
so local frontend against a deployed backend fails.

**10. Repo hygiene.** `__pycache__` directories and `tsconfig.tsbuildinfo` are
tracked. `refactor-toast.js` is a one-shot codemod with a hardcoded absolute
path from someone's machine, still sitting at the repo root. The working tree
currently shows 56 files changed with equal insertions and deletions, which is
a whole-file line-ending rewrite, not real work - see `06-git-workflow.md`.

## Where the system is genuinely strong

Worth saying, because the plan should not break it: the module boundaries on
the backend are clean and consistent, the response envelope is uniform, the
refresh-token interceptor with a queued retry is properly implemented, and
pushing invariants into PL/pgSQL means the data stays correct even if a client
misbehaves.
