# DomAI v54 — BUSINESS

Commercial web build.

## Server-side
- real registration/login using SQLite sessions;
- server-side projects;
- tariff API;
- order table with `pending` status;
- static frontend served by the Python server;
- Render-compatible `PORT` binding.

## Deployment
Render Web Service:
- Build: `pip install -r requirements.txt`
- Start: `python backend/server.py`
- Python: 3.13.5

Render requires the public service to bind to `0.0.0.0` and the `PORT` environment variable; this version does that.

## Payment
The order endpoint is deliberately only a payment preparation layer. A real payment provider and webhook must be connected before charging customers.

## Production checklist
Use PostgreSQL instead of local SQLite for multi-instance production, HTTPS, rate limiting, secure password hashing (Argon2/bcrypt), CSRF protection where applicable, secret environment variables, backups, privacy/terms pages, payment webhooks, and monitoring.

DomAI outputs remain preliminary/conceptual and do not guarantee official approval or replace working project documentation.
