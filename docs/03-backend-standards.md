# Backend Standards

## Response envelope

Every endpoint returns the same shape, success or failure:

```json
{ "success": true, "data": { }, "message": "Listings retrieved" }
```

`data` is `null` on failure. `message` is written for a human and is safe to
show in the UI. Use the shared `json_response(success, data, message)` helper;
do not hand-build dicts.

Field names are `snake_case` and match the database columns. When a field name
changes, it changes in `lib/types/` in the same pull request.

## Module layout

```
backend/modules/<module>/
    router.py       endpoints, validation, response assembly
    queries.py      SQL and the functions that run it
    schemas.py      Pydantic request and response models
```

Routers today hold their SQL inline. New modules use the split above; existing
modules move when they are next touched substantially. A router function should
read as: validate input, call a query function, wrap the result.

## Validation

Request bodies are Pydantic models, never bare `dict`. Constrain at the schema
level - `conint(ge=1)` for quantity, `EmailStr` for email, `max_length` on
strings - so bad input is rejected before it reaches SQL.

Path and query parameters are typed on the function signature so FastAPI
coerces and validates them.

## SQL

Always parameterised. `%s` placeholders with a tuple, never f-strings or
concatenation into a query.

Use `row_factory=dict_row` so results come back as dicts. Select the columns
you need; avoid `SELECT *` on `users`, which carries `password_hash`.

Business invariants belong in PL/pgSQL, not Python. If a rule must hold no
matter which client writes the row, it is a trigger or a function.

Acquire the connection for as short a span as possible:

```python
async with pool.connection() as conn:
    async with conn.cursor(row_factory=dict_row) as cur:
        await cur.execute(SQL, params)
        rows = await cur.fetchall()
```

Never do network calls or heavy computation inside the `async with`.

## Errors

Raise `HTTPException` for client errors with the right status: `400` malformed,
`401` unauthenticated, `403` authorised-but-forbidden, `404` missing, `409`
conflict, `422` validation.

Do not swallow exceptions into a `success: false` 200 response - several
endpoints currently do this and it makes real failures invisible to monitoring
and to the axios interceptor. A server fault is a `500`.

Never let a database error string reach the client. Log it, return a generic
message.

## Auth

`Depends(get_current_user)` for anything user-scoped, `Depends(require_admin)`
for admin actions. Never trust a role, user id, or ownership claim from the
request body; read it from the authenticated user.

When public read endpoints are added (see the offline plan), they use an
explicit optional dependency, not a removed one, so the intent is visible in
the signature.

## Configuration

All config through `backend/core/config.py` and `pydantic-settings`. No
`os.environ` reads scattered in modules, no literals for URLs, keys or expiry
windows.

CORS origins come from an env var and parse to a list. The current hardcoded
single Vercel origin blocks local development against a deployed backend.

## Housekeeping

- `requirements.txt` gets pinned versions. Unpinned dependencies make deploys
  non-reproducible.
- Remove `@router.on_event("startup")` - it is deprecated and the settings
  module's use of it does nothing. Table bootstrap belongs in the SQL script or
  a migration, not lazily inside a request handler.
- `__pycache__` should not be tracked in git.
