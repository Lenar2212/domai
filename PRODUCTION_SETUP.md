# DomAI v57 — production setup

## PostgreSQL
Set Render secret:
`DATABASE_URL=<PostgreSQL connection string>`

The package includes psycopg2-binary. The current application still contains legacy SQLite-oriented repository code, so **do not claim PostgreSQL migration is complete until the database adapter is fully converted and tested**. For a real multi-instance deployment, finish that migration first.

## Security
- password registration now uses PBKDF2-SHA256 with a random salt;
- response security headers are added;
- secrets are read from environment variables;
- payment credentials are never embedded in frontend.

## Paid delivery
`GET /api/download/project` requires a non-free entitlement and returns an HTML project package suitable for browser printing to PDF.

## Important
This version is a production-oriented scaffold, not a security audit. Before taking significant payments, perform a professional security review, complete PostgreSQL migration, configure backups, rate limiting, CSRF/session hardening, webhook idempotency and legal/tax requirements.
