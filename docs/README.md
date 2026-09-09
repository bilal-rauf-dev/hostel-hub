# HostelHub Engineering Docs

Reference material for anyone working on this codebase. Read `01-architecture.md`
first, then the standards doc for the layer you are touching.

| Doc | What it covers |
| :-- | :-- |
| [01-architecture.md](01-architecture.md) | How the system is put together today, and the honest list of what is weak |
| [02-frontend-standards.md](02-frontend-standards.md) | Next.js / React / TypeScript conventions |
| [03-backend-standards.md](03-backend-standards.md) | FastAPI, psycopg, response envelope, error handling |
| [04-database-standards.md](04-database-standards.md) | Schema, PL/pgSQL, migrations |
| [05-security.md](05-security.md) | Auth model, token handling, known gaps |
| [06-git-workflow.md](06-git-workflow.md) | Branching, commits, review, line endings |
| [adr/](adr/) | Architecture decision records |
| [plans/](plans/) | Feature plans awaiting implementation |

## Ground rules

1. **One response shape.** Every API response is `{ success, data, message }`. No exceptions.
2. **The UI never assumes the backend is up.** Every screen has a loading, empty, error and stale state.
3. **No new logic inside a view component.** Data access goes in `lib/`, state in a hook, rendering in the component.
4. **No secrets in the repo.** `.env*` is ignored; `.env.example` documents the keys only.
5. **A feature is done when it degrades gracefully**, not when the happy path works.
