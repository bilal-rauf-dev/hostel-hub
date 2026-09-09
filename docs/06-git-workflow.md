# Git Workflow

## Branches

`main` is deployable. Work happens on a branch off `main`.

```
feat/<area>-<short-description>
fix/<area>-<short-description>
chore/<what>
docs/<what>
refactor/<area>
```

Examples: `feat/offline-first-guest-mode`, `fix/maintenance-mode-contract`,
`chore/untrack-pycache`.

Keep branches short-lived. Rebase on `main` rather than merging `main` in, so
history stays readable.

## Commits

Imperative mood, one logical change per commit, subject under 72 characters.

```
Add offline cache layer for marketplace listings

Wraps every read endpoint in a cache-then-network resource so the
marketplace renders from IndexedDB when the API is unreachable.
```

Do not mix a refactor with a behaviour change in one commit. Do not commit
generated files, build output, or `__pycache__`.

## Line endings

The working tree currently reports 56 files changed with identical insertion
and deletion counts. That is a whole-file CRLF/LF rewrite, not real work, and
it will destroy the diff of any pull request it lands in.

Fix it once, on its own branch, before feature work:

```
# .gitattributes
* text=auto eol=lf
*.sql text eol=lf
*.png binary
*.jpg binary
```

Then `git add --renormalize .` and commit alone. After that, set
`core.autocrlf=false` locally on Windows.

## Repo hygiene backlog

Small, safe, do them as separate `chore/` commits:

- Untrack `__pycache__/` and `tsconfig.tsbuildinfo`
- Delete `refactor-toast.js` (one-shot codemod with a hardcoded absolute path
  from a machine that no longer matters)
- Rewrite `.env.example` to describe this project's variables
- Rename `package.json` `"name"` from `ai-studio-applet` to `hostel-hub`
- Correct the README: it says Next.js 14, the project runs Next.js 15 and
  React 19

## Review

Every change to `main` goes through a pull request. The description says what
changed and why, and lists what was manually verified. A pull request that
touches the API contract updates `lib/types/` and the docs in the same change.

Before requesting review: `npm run build` passes, `npm run lint` is clean, and
the app was exercised by hand with the backend both running and stopped.
