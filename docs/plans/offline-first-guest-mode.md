# Plan: Offline-first reads and guest mode

**Status:** Phases 0-4 implemented on the branch, uncommitted. Phase 5 partial.
**Branch:** `feat/offline-first-guest-mode`
**Decision record:** [ADR 0001](../adr/0001-offline-first-with-guest-mode.md)

## The problem

Open the deployed app with the backend down and you get a splash screen, then a
login form that rejects everything, and nothing else. Sign in successfully,
then lose connectivity, and every panel empties out. The frontend has no
memory: `lib/api.ts` is a thin axios wrapper, each of the fifteen view
components fetches on mount, and a failure means an error string or a spinner
that never resolves.

Three consequences worth naming:

- A reviewer or recruiter opening the live link while the backend is cold sees
  a broken product.
- A student on hostel wifi loses the guidebook and emergency contacts exactly
  when a dropped connection is most likely.
- There is no way to look at HostelHub at all without an account, which makes
  it hard to show.

## The goal

The app should be useful the moment it loads, whether or not the API answers:

- **A visitor with no account** browses public content - guidebook, events,
  safety alerts, marketplace listings, lost and found - in read-only mode, and
  is prompted to sign in only when they try to act.
- **A signed-in student who goes offline** keeps seeing the last data they
  loaded, clearly marked as stale, with the time it was fetched.
- **A cold load with a dead backend** renders whatever was cached, and an
  honest connection banner rather than a wall of errors.

Reads work offline. Writes still require the network in this phase, and fail
with a clear message instead of pretending to succeed.

## Approach

Four layers, built bottom-up. Each phase leaves the app working.

```
IndexedDB  <-  cache store (per-user namespace, TTL, metadata)
    |
resource layer  <-  cache-then-network, dedupe, revalidate, staleness
    |
hooks  <-  useResource wrappers per module
    |
views  <-  four explicit states: loading / ready / stale / empty
```

## Phase 0 - Groundwork

Small, safe, unblocks everything after it. Do this first and merge it.

1. **Line-ending normalisation.** Add `.gitattributes` with `* text=auto
   eol=lf`, run `git add --renormalize .`, commit alone. Without this, every
   pull request in this feature carries a 27,000-line phantom diff.

2. **Repo hygiene.** Untrack `__pycache__/` and `tsconfig.tsbuildinfo`, delete
   `refactor-toast.js`, rewrite `.env.example` for this project's actual
   variables.

3. **Fix the maintenance-mode contract bug.** `app/page.tsx` reads
   `data.data.maintenance_mode`; the endpoint returns `data.enabled`.
   Maintenance mode has never fired on the client. Align on `enabled` and
   type it.

4. **Shared domain types.** Create `lib/types/` with `api.ts` (the
   `ApiResponse<T>` envelope) and one file per module. Types only, no runtime
   change. This is what stops the next contract drift.

5. **Env-driven CORS.** Replace the hardcoded Vercel origin with a parsed env
   list so local frontend against deployed backend works.

## Phase 1 - Cache store

`lib/offline/store.ts` - a thin typed wrapper over IndexedDB. No dependency
needed; the native API is enough for a key-value store with metadata. Use
`idb-keyval` only if the raw API proves awkward.

One object store, `resources`, keyed by a namespaced string:

```
<scope>:<resource-key>
  guest:guidebook
  guest:events
  user:42:notifications
  user:42:marketplace:listings?category=Books
```

Each record:

```ts
interface CacheEntry<T> {
  key: string
  scope: 'guest' | `user:${number}`
  data: T
  fetchedAt: number      // epoch ms
  ttlMs: number          // soft staleness threshold
  schemaVersion: number  // bump to invalidate on shape change
}
```

Responsibilities:

- `get(key)`, `set(key, data, ttlMs)`, `remove(key)`
- `clearScope(scope)` - called on logout, wipes every `user:<id>:*` key
- Schema-version invalidation on read: a mismatch discards the entry
- Quota handling: catch `QuotaExceededError`, evict oldest by `fetchedAt`
- Graceful degradation: if IndexedDB is unavailable (private browsing, older
  browser), fall back to an in-memory Map so nothing crashes

**Scope discipline is the security boundary here.** Personal data - orders,
notifications, tickets, profile - is written under `user:<id>:` and only ever
read back when the decoded token's `user_id` matches. Public content is
written under `guest:` and survives logout. Getting this wrong means one
student's orders showing to the next person on a shared machine, so it gets a
dedicated test.

TTL guidance: guidebook 24h, events and listings 5m, safety alerts 1m,
notifications 30s, profile 1h. TTL controls *when to revalidate*, never whether
to render - expired data is still shown, marked stale.

## Phase 2 - Resource layer

`lib/offline/resource.ts` - the piece every hook is built on.

```ts
export type ResourceStatus = 'loading' | 'ready' | 'error'

export interface ResourceState<T> {
  data: T | null
  status: ResourceStatus
  error: string | null
  isStale: boolean      // rendering cache while network failed or TTL expired
  fetchedAt: number | null
  refresh: () => Promise<void>
}
```

Read flow:

1. Read cache synchronously into state; if present, `status: 'ready'` with
   `isStale` set from TTL. First paint has content.
2. Fire the network request in the background.
3. On success: write cache, update state, clear `isStale`.
4. On failure with cached data: keep the data, set `isStale`, do not set
   `status: 'error'`. **A cache hit plus a network failure is not an error
   state.**
5. On failure with no cached data: `status: 'error'`.

Also handled here:

- **Request dedupe.** Concurrent callers for the same key share one in-flight
  promise. Several views request notifications today.
- **Connectivity.** `navigator.onLine` plus a `/health` probe with backoff
  (2s, 4s, 8s, capped at 60s). `navigator.onLine` alone lies - it reports true
  on a wifi network with no route out. The probe is the truth.
- **Visibility-aware revalidation.** Replaces the unconditional 30s and 60s
  `setInterval` polls in `dashboard-view.tsx`. Pause when `document.hidden`,
  revalidate on focus and on the online event.

`lib/offline/connectivity.tsx` exposes a context with
`{ isOnline, isBackendReachable, lastCheckedAt }`.

## Phase 3 - Guest mode

### Backend

Add an optional-auth dependency next to the existing ones:

```python
async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    pool=Depends(get_db_pool),
) -> dict[str, Any] | None:
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials, pool)
    except HTTPException:
        return None
```

Switch these read endpoints to it:

| Endpoint | Public shape |
| :-- | :-- |
| `GET /api/v1/guidebook/` | Full entries |
| `GET /api/v1/events/` | Event details; RSVP counts only, no attendee identities |
| `GET /api/v1/safety-alerts/` | Active alerts only |
| `GET /api/v1/marketplace/listings` | Listing details; seller shown as display name, contact withheld |
| `GET /api/v1/lost-found/` | Items; anonymous posts stay anonymous, no reporter contact |

Everything else - notifications, orders, tickets, community posts, profile,
polls, the entire admin surface - stays behind `get_current_user` or
`require_admin`.

**The field-redaction rule:** when `user is None`, the handler selects a
narrower column set. Redaction happens in the SQL, not by deleting keys from a
dict after the fact - that is how contact numbers leak. This needs an explicit
review pass over each of the five endpoints; it is the highest-risk part of the
plan.

Add a `GET /api/v1/public/bootstrap` returning guidebook, active alerts and
upcoming events in one payload, so a cold guest load is one round trip rather
than three.

### Frontend

Session state becomes three modes, in `lib/session/`:

```ts
type SessionMode = 'guest' | 'authenticated' | 'offline-authenticated'
```

- `guest` - no token; public reads only; writes open a sign-in prompt
- `authenticated` - valid token, backend reachable
- `offline-authenticated` - valid token, backend unreachable; cached personal
  data renders, marked stale; writes blocked with an explanation

The login screen gains a **"Continue as guest"** action beside sign-in. It sets
guest mode and enters the dashboard with the public tabs only.

`app/page.tsx` currently gates the whole app on `isAuthenticated()`. It needs
restructuring so the dashboard is reachable in guest mode - hidden tabs
(Tickets, Community, Settings, all admin views) rather than a hard redirect.

Every write path gets a guard:

```ts
if (mode !== 'authenticated') return promptSignIn(action)
```

`promptSignIn` opens a modal explaining what the action needs, and returns the
user to where they were after signing in.

## Phase 4 - View migration

Order matters. Start with the simplest read-only view to prove the pattern,
finish with the most complex.

| Order | View | Why |
| :-- | :-- | :-- |
| 1 | `guidebook-view` | 156 lines, one read, no writes. Reference implementation. |
| 2 | `safety-alerts-view` | Short TTL, tests staleness display |
| 3 | `events-view` | Adds a guarded write (RSVP) |
| 4 | `lost-found-view` | Mixed read and write |
| 5 | `overview-view` | Composes several resources |
| 6 | `marketplace-view` | Largest public surface, needs the 400-line split first |
| 7 | `tickets-view`, `community-view`, `settings-view` | Authenticated only, cached for offline read |
| 8 | Admin views | Authenticated only; cache but never expose in guest mode |

Each migration: replace the `useEffect` fetch with a `useResource` hook, add
the four states, split out modals and forms if the file is over 400 lines,
type the payload in `lib/types/`.

### The UI for staleness

This is what makes the feature feel deliberate rather than broken.

- **Connection banner** below the header when the backend is unreachable:
  "Offline. Showing data from 12 minutes ago." with a retry button. One banner
  for the whole app, not one per panel.
- **Per-panel stale marker** - a small muted timestamp on any card group
  rendering expired cache.
- **Disabled write controls** in guest and offline modes, with a tooltip
  saying why. Disabled, not hidden - a control that vanishes reads as a bug.
- **Empty is not error.** "No listings yet" and "Couldn't load listings" are
  different components with different visuals.

## Phase 5 - Verification

No test suite exists today, so this phase also establishes one. Vitest plus
React Testing Library for the frontend, pytest for the backend.

**Automated:**
- Cache store: set, get, TTL expiry, scope wipe on logout, schema-version
  invalidation, quota eviction, IndexedDB-unavailable fallback
- Resource layer: cache hit renders first, network failure with cache does not
  produce an error state, dedupe, backoff schedule
- Backend: each public endpoint returns redacted fields with no token and full
  fields with one; each private endpoint still `401`s without a token

**Manual, per view:**
1. Backend running, first load - data appears, no stale marker
2. Backend killed, reload - cached data appears, banner shows, timestamp
   correct
3. Backend killed, no cache (fresh profile) - honest error state, no spinner
4. Guest mode - public tabs visible, private tabs absent, writes prompt sign-in
5. Sign out - `user:<id>:*` keys gone from IndexedDB, `guest:*` keys intact
6. Sign in as a different user on the same browser - none of the previous
   user's data is visible
7. Throttled network (slow 3G in devtools) - cache paints first, revalidation
   updates without layout shift

Step 6 is the one that must not be skipped.

## Risks

| Risk | Mitigation |
| :-- | :-- |
| Personal data leaking across users on a shared browser | Scoped keys, `clearScope` on logout, dedicated test, manual step 6 |
| Public endpoints over-exposing fields | Redaction in SQL not in Python; explicit review of all five endpoints |
| Stale data mistaken for live | Always-visible timestamp and banner; never render stale data silently |
| Cache and API shapes drifting | `schemaVersion` bump invalidates; shared types in `lib/types/` |
| Scope creep into offline writes | Explicitly out of scope; queued mutations are a separate ADR |
| Large views becoming unreviewable | 400-line split happens before migration, in its own commit |

## Out of scope

Offline writes and a sync queue. Service worker and installable PWA. Push
notifications. Server-side rendering. The httpOnly-cookie auth migration - it
is the right fix for token storage but it is a separate change with its own
blast radius, tracked in `docs/05-security.md`.

## Sequencing summary

```
Phase 0  groundwork ....................... merge alone, unblocks the rest
Phase 1  cache store ...................... no user-visible change
Phase 2  resource layer + connectivity .... no user-visible change
Phase 3  guest mode (backend + session) ... "Continue as guest" appears
Phase 4  view migration ................... offline UI lands view by view
Phase 5  tests + manual verification ...... gate before merge to main
```

Phases 1 and 2 ship behind no flag because nothing consumes them yet. Phase 3
onward is user-visible; keep `main` deployable by merging complete phases
rather than partial ones.


---

## Implementation log

Written after the build pass. Everything below is on the branch and
**uncommitted** -- review it before committing anything.

### What landed

**Phase 0**
- `.gitattributes` added. The renormalise commit itself has NOT been run;
  do `git add --renormalize .` and commit it alone before anything else.
- `.env.example` rewritten for this project's real variables.
- Maintenance-mode contract bug fixed: `app/page.tsx` now reads
  `data.enabled`. It also no longer locks the user out when the check itself
  cannot reach the server, which was the wrong behaviour for an offline-capable
  app.
- `lib/types/` created: `api.ts` plus one file per module.
- CORS moved to a `CORS_ORIGINS` env var (`settings.cors_origin_list`).
- `get_current_user` no longer selects `password_hash`.

**Phase 1** - `lib/offline/store.ts`. IndexedDB wrapper with scoped keys, TTLs,
`CACHE_SCHEMA_VERSION` invalidation, quota eviction, and an in-memory fallback
for private browsing.

**Phase 2** - `lib/offline/resource.ts` (cache-then-network, dedupe, error
mapping), `lib/offline/connectivity.tsx` (health probe with backoff, visibility
aware), `hooks/use-resource.ts` (the React binding), `lib/offline/format.ts`.

**Phase 3**
- `get_optional_user` in `backend/auth/dependencies.py`. An expired token
  degrades to guest rather than 401, so a stale tab still shows public content.
- Public reads: guidebook, safety alerts, events, lost & found, marketplace
  listings. Redaction is in the SQL. Guests get `created_by`, `reporter` and
  `seller_id` as `NULL::int`, so listings cannot be used to enumerate
  residents.
- `GET /api/v1/public/bootstrap` in `backend/modules/public/`.
- `lib/session/session-context.tsx`: three modes, `useWriteGuard`, and a
  `signOut` that clears the user's cache scope before dropping the identity.
- `components/offline/`: connection banner, four resource states, sign-in
  prompt modal.
- "Continue as guest" on the login form.
- The axios 401 interceptor no longer tries to refresh when no refresh token
  exists, so a guest hitting a private route is not bounced to login.

**Phase 4** - migrated: guidebook, events, lost & found, marketplace, overview,
and the dashboard shell (notifications, profile, safety alerts). The shell's two
unconditional `setInterval` polls are gone; revalidation is visibility-aware.

### Bugs the type layer surfaced

Worth reading, because these were all live:

1. **Placing an order has never worked.** `place_order()` inserts `'pending'`
   into `order_status`, an enum of `('confirmed','delivered','cancelled')`.
   `marketplace_orders.status` also defaults to `'pending'`. Both are invalid.
   Fixed by `database/migrations/0001_add_pending_order_status.sql`, which must
   be applied.
2. **Notifications could not be marked read.** The dashboard filtered on
   `notif.id`; the API returns `notification_id`, so the click did nothing.
3. **Dead UI branches** in marketplace keyed on `'fulfilled'`, a status the
   database cannot produce.
4. **Missing fields** rendered as `undefined`: `event.image`, `event.category`,
   `item.image` (the column is `image_url`). The events category filter was
   filtering on a field the API never returns.
5. `item_date` can be null, and `new Date(null)` was being formatted.

### Not done

- **Phase 5 is partial.** `npx tsc --noEmit` and `npx next build` both pass
  clean. No test suite was added -- Vitest, RTL and pytest still need setting
  up, and the manual matrix in Phase 5 has not been run against a live backend.
- Views still on the old fetch pattern: tickets, community, settings,
  staff-tickets, verification, admin-community, admin-settings,
  admin-dashboard, safety-alerts (admin). All are authenticated-only, so they
  are correct today, just not cached.
- The 400-line split for `marketplace-view.tsx` (838 lines) and
  `admin-community-view.tsx` (1022 lines) has not been done.
- `refactor-toast.js` is still at the repo root. The device shell cannot delete
  files; remove it by hand.

### Verify before merging

The one that matters: sign in as user A, browse, sign out, sign in as user B on
the same browser, and confirm none of A's orders, tickets or notifications
appear. `SessionProvider.signOut` clears the `user:<id>:` scope, but this is
the failure mode worth checking by hand.
