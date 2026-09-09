# Database Standards

## Conventions

| Thing | Rule |
| :-- | :-- |
| Tables | plural, `snake_case` (`marketplace_listings`) |
| Primary key | `<singular>_id SERIAL PRIMARY KEY` |
| Timestamps | `TIMESTAMPTZ DEFAULT NOW()`, never naive `TIMESTAMP` |
| Booleans | `is_` prefix (`is_verified`, `is_suspended`) |
| Functions | `verb_noun` (`place_order`, `register_user`) |
| Trigger functions | `fn_<event>` |
| Triggers | `trg_<event>` |
| Enums | native `CREATE TYPE`, not `VARCHAR` + `CHECK`, for closed sets |

Every foreign key states its delete behaviour explicitly - `ON DELETE CASCADE`
for owned children, `ON DELETE SET NULL` for authorship references that should
survive a deleted user.

## Where logic lives

Invariants that must hold regardless of the client belong in the database.
The existing set is the model to follow:

- `trg_prevent_self_order` - a seller cannot order their own listing
- `trg_ticket_notification` - status change fans out a notification
- `trg_auto_archive_items` - resolved lost-and-found items archive themselves
- `trg_updated_at` - maintains `updated_at` on modification
- `place_order` - validates quantity and decrements stock atomically
- `process_order_cancellation` - cancels with inventory rollback

Application-layer convenience (formatting, pagination shaping, presentation
defaults) stays in Python. Do not push presentation into PL/pgSQL, and do not
pull an invariant out of it into a router.

## Migrations

`database/hostelhub.sql` is the full-build script. It stays authoritative for a
fresh install.

Once the schema is deployed anywhere real, every change also ships as a
numbered forward migration:

```
database/migrations/0001_add_last_synced_at.sql
database/migrations/0002_public_content_flags.sql
```

Each migration is idempotent where it can be (`IF NOT EXISTS`, `CREATE OR
REPLACE`), states its rollback in a comment, and is applied in order. Never
edit an already-applied migration; add a new one.

## Indexes

Index every foreign key used in a join, and every column used in a `WHERE` on a
table expected to grow: `marketplace_listings(category)`,
`maintenance_tickets(status)`, `notifications(user_id, is_read)`,
`lost_found_items(is_archived)`.

Check with `EXPLAIN ANALYZE` before adding one; an unused index is write cost
for nothing.

## Safety

- No destructive statement without a `WHERE`, ever.
- Seed data lives in a clearly marked section of the setup script and is
  demo-only. Production credentials never appear in SQL files.
- Passwords are bcrypt hashes written by `register_user`. No plaintext, no
  reversible encoding, no hash algorithm change without a re-hash path.
