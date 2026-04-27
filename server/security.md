# Security

This document captures the security posture of the Seedolino server and the
configuration required to run it safely. Treat the contents as a checklist before
promoting the service to a public environment.

## Threat model

The service stores book metadata and hosts static audio/image/PDF assets. There is a
single privileged actor (the content editor) who authenticates via HTTP Basic Auth and
mutates data through `/api/*` write endpoints and `/admin`. All other callers are
untrusted read clients (the public app).

## HTTP hardening

- **Helmet** is installed with a strict Content-Security-Policy:

  ```
  default-src 'self';
  img-src 'self' data: blob:;
  media-src 'self' blob:;
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  frame-ancestors 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  ```

  `style-src 'unsafe-inline'` is required by Tailwind's runtime style injection in the
  admin UI; script-src stays nonce-free and strict.

- **HSTS**, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `X-Frame-Options: DENY`, and cross-origin isolation headers are all set by Helmet
  defaults.

- **CORS** is restricted to the origins listed in `CORS_ORIGIN` (comma-separated). The
  admin UI and any production front-end origin(s) must be listed explicitly — no `*`.

- **Rate limiting** via `express-rate-limit`:
    - Public reads: 100 requests/minute/IP.
    - Write endpoints: 30 requests/minute/IP.
    - `/api/translate`: 20 requests/minute/IP (expensive ML path).

- **Body parsers** cap JSON at 1 MB, URL-encoded at 100 KB.

- **HPP** (HTTP parameter pollution) and **express-mongo-sanitize** strip operator
  characters (`$`, `.`) from query strings and bodies to prevent NoSQL injection.

## Input validation

Every write endpoint runs through a Zod schema before the controller fires. Validation
errors return HTTP 400 with a per-field breakdown:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "localizations.de.title", "message": "must be a non-empty string" }
    ]
  }
}
```

The error message states exactly which field failed and why. No free-form fallback.

## Authentication

The admin surface and every write endpoint are protected by HTTP Basic Auth
(`express-basic-auth`). The credentials are configured via `ADMIN_USER` and
`ADMIN_PASSWORD`. Default values in `.env.example`:

```
ADMIN_USER=admin
ADMIN_PASSWORD=***REMOVED***
```

**Rotate the password before deploying to any public environment.** The `.env` file is
git-ignored; production secrets live in Render's encrypted env var store.

Future hardening ideas:

- Move to session cookies backed by a `SESSION_SECRET` with CSRF protection.
- Add OAuth/Google sign-in for editors if the team grows past one person.

## Uploads

`multer` saves files to disk under `AUDIOBOOKS_DIR` and `UPLOADS_DIR`. Each upload is
sniffed for MIME type and rejected unless it matches the whitelist:

| Kind       | Allowed MIME types                      | Size cap |
|------------|-----------------------------------------|----------|
| Audio      | `audio/ogg`                             | 50 MB    |
| Image      | `image/webp`, `image/jpeg`, `image/png` | 5 MB     |
| Attachment | `application/pdf`                       | 25 MB    |

Filenames are replaced with a SHA-1 hash of the buffer to prevent user-controlled
filename attacks (path traversal, double extensions, `.htaccess` injection).

## Static file serving

- `GET /audiobooks/*` and `GET /uploads/*` are served via `express.static` with
  `acceptRanges: true`, `cacheControl: true`, and `immutable` for content-hashed assets.
- `dotfiles: 'deny'` prevents `.git`, `.env`, and other dotfile leaks.
- The Express root refuses requests with `..` in the path (default behavior).

## MongoDB Atlas configuration

1. Create a project and an **M0** (or higher) cluster.
2. Create a database user with the minimum role `readWrite` on the `kanaan` database.
3. Network Access: prefer allow-listing Render's egress IPs
   (<https://render.com/docs/static-outbound-ip-addresses>). Only use `0.0.0.0/0` if
   Render cannot supply static IPs for your plan.
4. Enable **TLS / SSL** (on by default for Atlas). Connection string must use
   `mongodb+srv://` with `retryWrites=true&w=majority`.
5. Enable **Database Auditing** if available on your tier.
6. Set up **daily backups** — Atlas Cloud Backup is recommended.

Place the full connection string in the `MONGO_URI` env var. Never log it.

## Redis configuration

- Use a managed provider (Render Redis, Upstash, or Redis Cloud). The TLS form
  `rediss://` is required in production — plaintext `redis://` only for local dev.
- Set `REDIS_URL` and `REDIS_ENABLED=true`. Cache TTL is 10 minutes by default
  (`CACHE_TTL_SECONDS=600`).
- If Redis is unavailable the server logs once per minute and falls back to Mongo —
  it does not crash. Keep `REDIS_ENABLED=false` for environments without Redis.

## Persistent storage on Render

The free Render plan has ephemeral disk — uploaded audio/images/PDFs are lost on every
redeploy. Options:

- **Starter or higher** with a `disk:` mount in `render.yaml`
  (`/opt/render/project/src/server/audiobooks`,
  `/opt/render/project/src/server/uploads`).
- Switch to **S3-compatible storage** (R2, Backblaze B2, Spaces) — out of scope for the
  current release; file a follow-up ticket.

## Translation service

`@huggingface/transformers` downloads `Xenova/nllb-200-distilled-600M` (~1.2 GB) into
`HF_HOME` on first call. Cache the directory between deploys to avoid repeat downloads.
The model runs entirely on CPU — no external network calls once cached.

If the host has less than 2 GB of RAM, set `TRANSLATION_ENABLED=false` and the endpoint
returns 503 `TRANSLATION_DISABLED`.

## Secrets checklist

Do **not** commit any of the following. Configure them in Render env vars:

- `MONGO_URI`
- `REDIS_URL`
- `ADMIN_USER`, `ADMIN_PASSWORD`
- `CORS_ORIGIN`
- `PUBLIC_BASE_URL`
- `HF_HOME` (if you want to pin the cache location)
- `SESSION_SECRET` (reserved for future session-cookie migration)

## Logging

- All HTTP traffic is logged to `logs/app-YYYY-MM-DD.log` (daily rotate, 14-day
  retention) via Winston + Morgan.
- Errors additionally stream to `logs/errors.log` for on-call triage.
- PII is not logged. Basic-auth credentials never appear in logs (Morgan is configured
  to strip the `Authorization` header).

## Reporting

Security issues: email the maintainer at the address listed in `package.json` instead
of opening a public issue.
