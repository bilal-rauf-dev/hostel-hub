# Frontend Standards

## TypeScript

**Ban `any` in new code.** Every API payload gets a named type in
`lib/types/`, one file per module, mirroring the backend response shape:

```ts
// lib/types/marketplace.ts
export interface Listing {
  listing_id: number
  seller_id: number
  title: string
  description: string
  category: string
  price: number
  quantity: number
  image_url: string | null
  created_at: string
}
```

Wrap responses in the shared envelope rather than restating it:

```ts
// lib/types/api.ts
export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}
```

Prefer `unknown` plus a narrowing check over `any` when a shape is genuinely
uncertain. Do not use non-null assertions (`!`) to silence the compiler; handle
the null case.

When migrating an existing view, type it as part of whatever change you are
already making there. Do not open a separate "add types" pull request across
fifteen files.

## Component structure

A view component renders. It does not fetch, transform, or hold server state.

```
components/dashboard/marketplace-view.tsx   <- layout and composition only
components/dashboard/marketplace/
    listing-card.tsx
    create-listing-form.tsx
    order-detail-modal.tsx
hooks/use-listings.ts                       <- fetching, caching, mutation
lib/api.ts                                  <- transport
```

Hard limits: **400 lines per file, 8 `useState` calls per component.** Past
either, extract. Modals and forms defined inside a view file get their own
file. Related state moves to `useReducer` or into a hook.

## Data fetching

All server reads go through a hook built on the shared resource layer (see the
offline plan), never through a bare `useEffect` calling `lib/api.ts`. A hook
returns a consistent shape:

```ts
const { data, status, error, isStale, refresh } = useListings()
// status: 'loading' | 'ready' | 'error'
```

Every screen handles four states explicitly: **loading, empty, error, stale**.
An empty list and a failed request must not look the same. A view showing
cached data must say so.

No `setInterval` polling without a visibility guard. Polls pause when
`document.hidden` is true and resume on focus.

## Styling

Tailwind utility classes, `cn()` from `lib/utils.ts` for conditional merging.

Use the CSS variables in `app/globals.css` (`bg-background`, `text-foreground`,
`bg-primary`) rather than hardcoding `#4D5D53` and friends. New hex literals in
components are a review comment. Existing hardcoded values get converted
opportunistically, not in a sweep.

Radius, spacing and font weight follow what is already there: `rounded-2xl` for
cards, `rounded-xl` for controls, `font-black uppercase tracking-widest` at
small sizes for labels.

## Motion

`motion/react` for transitions. Keep entrance animations under 400ms. Respect
`prefers-reduced-motion`. Do not animate anything that blocks the user from
reading data.

## State and side effects

- Server state: the resource layer / hooks.
- UI state (open modal, active tab, form draft): local `useState`.
- Cross-cutting session state (current user, guest mode, connectivity): React
  context in `lib/session/`, not prop drilling and not module globals.

Every `useEffect` with a subscription, timer or listener returns a cleanup
function. Every `async` effect guards against setting state after unmount.

## Errors and toasts

Toasts are raised through the `onToast` prop threaded from
`dashboard-view.tsx`. Do not reintroduce per-view toast state. If the prop
chain gets deep, promote the toast host to context.

Never surface a raw axios error to the user. Map it:

```ts
const message = err?.response?.data?.message ?? 'Something went wrong. Try again.'
```

`console.error` is fine for diagnostics; it is not user feedback.

## Accessibility

Every interactive element is a real `<button>` or `<a>`, focusable, with a
visible focus ring. Icon-only controls carry `aria-label`. Modals trap focus,
close on Escape, and restore focus on close. Form inputs have associated
labels. Colour is never the only signal for state.

## Performance

`next/image` for all images with explicit dimensions. Debounce search inputs at
300ms (already the pattern in marketplace). Lazy-load admin views - they are
large and most users never open them. Keep the initial dashboard bundle lean.
