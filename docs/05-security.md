# Security

## Current model

Login returns a short-lived access JWT and a refresh token. Both are stored in
`localStorage`. The axios interceptor refreshes on `401` once, queues
concurrent failures behind that refresh, and on failure clears tokens and
redirects to `/`. Roles are enforced server-side by `require_admin`; the
client-side role read from the decoded token is presentation only.

## Known gaps, ranked

**1. Tokens in `localStorage` are readable by any script on the origin.** Any
XSS becomes full account takeover, and the refresh token means it persists.
The correct fix is httpOnly, Secure, SameSite cookies for the refresh token
with the access token held in memory. That is a real change to both tiers and
should be its own ADR and its own branch - not folded into the offline work.
Until then, treat XSS prevention as the primary control.

**2. Token expiry is long.** `access_token_expire_minutes` defaults to 1440 and
refresh to 30 days. Shorten the access token to 15-30 minutes; the refresh
interceptor already handles the rotation transparently.

**3. Refresh tokens are not rotated or revocable.** Logout does not invalidate
anything server-side. A leaked refresh token is valid for its full window.
Persist a token id or hash and check it on refresh.

**4. CORS is a hardcoded single origin.** Move to an env-driven list. Keep
`allow_credentials` honest: it cannot be combined with a wildcard origin.

**5. No rate limiting.** `/auth/login`, `/auth/register` and `/auth/verify-otp`
are unthrottled, so credential stuffing and OTP brute force are both open.
Add per-IP and per-account limits with lockout on repeated failure.

**6. Errors leak internals.** Several handlers interpolate the exception string
into `message`, which is then rendered in the UI. Log the detail, return a
generic message.

**7. `SELECT *` on `users` pulls `password_hash`** into `get_current_user` and
from there into request handling. Select explicit columns.

## Rules for new code

- Never trust `user_id`, `role`, or ownership from a request body. Read them
  from the authenticated user.
- Every mutation re-checks ownership or admin role server-side, even when the
  UI already hides the control.
- All SQL parameterised. No string interpolation into queries, ever.
- Escape or sanitise anything user-authored rendered as markup. React escapes
  by default; `dangerouslySetInnerHTML` requires a written justification.
- No secrets in the repo. `.env*` stays gitignored; `.env.example` lists key
  names with placeholder values only. The current `.env.example` describes AI
  Studio variables that this project does not use - it should describe
  `NEXT_PUBLIC_API_URL`, `DATABASE_URL`, `SECRET_KEY` and the token windows.
- Anything cached client-side for offline use is subject to
  `docs/plans/offline-first-guest-mode.md` - personal data is namespaced per
  user and wiped on logout.
