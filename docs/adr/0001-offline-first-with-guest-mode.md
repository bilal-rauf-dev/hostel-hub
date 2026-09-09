# ADR 0001: Offline-first reads with a guest mode

**Status:** Proposed
**Date:** 2026-09-09

## Context

HostelHub is entirely useless without a reachable FastAPI backend. Every view
mounts, fires an authenticated request, and renders an error or a permanent
spinner if that request fails. There is no cached data, no public content, and
no way to see the application at all without credentials. For a demo, a flaky
hostel network, or a reviewer opening the deployed link while the free-tier
backend is cold, the product looks broken.

## Decision

Two changes, taken together:

1. **A client-side cache-then-network resource layer.** Reads go through a
   layer that returns cached data immediately, revalidates in the background,
   and marks the UI as stale when the network fails. Cache lives in IndexedDB,
   namespaced per user.

2. **A guest mode with public read endpoints.** A subset of content -
   guidebook, events, safety alerts, marketplace listings, lost and found -
   becomes readable without a token. A visitor can browse without an account;
   any write prompts sign-in.

## Alternatives considered

**Service worker with Workbox / a full PWA.** More capable, and it would also
cache the app shell. Rejected as the first step because it introduces a second
caching layer with its own invalidation and update semantics on top of a
codebase that has no tests. The resource layer is a prerequisite for it either
way, and a service worker can be added later on top without rework.

**Server-side rendering the public pages.** Would give a fast first paint and
real SEO, but requires the backend to be up at request time, which is the
problem being solved.

**Mock data fallback.** Shipping fixtures that render when the API fails. It
makes the app look alive while showing information that is not true, which is
worse than an honest stale badge.

**Local writes with a sync queue.** Attractive, and deliberately deferred.
Conflict resolution against PL/pgSQL invariants such as `place_order` quantity
checks is a genuinely hard problem. Phase 1 is read-only offline; queued writes
are a separate future decision.

## Consequences

Positive: the app renders without a backend; a visitor can evaluate it without
signing up; repeat loads are faster; a dropped connection stops being fatal.

Negative: cached data can be stale and the UI has to say so honestly; personal
data now sits in browser storage and must be wiped on logout; the backend
grows a second auth posture (optional bearer) that has to be audited so
private data is never exposed on a public route.

Explicitly out of scope: offline writes, background sync, push notifications,
installable PWA.
