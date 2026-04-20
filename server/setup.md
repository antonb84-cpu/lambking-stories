# Setup

Quick start for running the API + admin UI locally, plus deployment notes for
Render.com and DigitalOcean App Platform.

## 1. Prerequisites

- Node 22+ and pnpm 10 (`corepack enable && corepack prepare pnpm@10.6.2 --activate`)
- A MongoDB Atlas cluster (the free M0 tier is fine)
- Optional: a Redis instance (Upstash / Render / DigitalOcean) — skip by setting
  `REDIS_ENABLED=false`

## 2. Environment files

The `dev` script loads `server/.env.local`; `build` and `start` load
`server/.env`. Copy the template and fill in the sensitive values:

```bash
cp server/.env.example server/.env
cp server/.env.example server/.env.local
```

At a minimum, set:

| Var               | Example / Notes                                       |
|-------------------|-------------------------------------------------------|
| `MONGO_URI`       | `mongodb+srv://user:pass@cluster.mongodb.net/kanaan`  |
| `ADMIN_PASSWORD`  | Rotate from the default before any public deploy      |
| `REDIS_URL`       | `redis://localhost:6379` or `rediss://…` (prod)       |
| `REDIS_ENABLED`   | `true` to use cache, `false` to skip                  |
| `CORS_ORIGIN`     | `http://localhost:5173,http://localhost:5174` locally |
| `PUBLIC_BASE_URL` | `http://localhost:4000` locally                       |

Both files are git-ignored.

## 3. Install + run (dev)

From the repo root:

```bash
pnpm install

# Terminal 1 — API on :4000
pnpm --filter little-bible-stories-server dev

# Terminal 2 — admin UI on :5173 (proxies /api, /audiobooks, /uploads → :4000)
pnpm --filter little-bible-stories-adminui dev
```

Open <http://localhost:5173>, log in with `admin` / your `ADMIN_PASSWORD`, and
author a book.

Health probe:

```bash
curl http://localhost:4000/healthz
# → { "ok": true, "mongo": true, "redis": true }
```

## 4. Install + run (production-style locally)

```bash
pnpm --filter little-bible-stories-adminui build   # → server/public/admin/
pnpm --filter little-bible-stories-server build    # → server/dist/
pnpm --filter little-bible-stories-server start    # serves admin + API on :4000
```

Admin UI is then at <http://localhost:4000/admin>.

## 5. Tests

```bash
pnpm --filter little-bible-stories-server test     # 27 tests
pnpm --filter little-bible-stories-adminui test    # 27 tests
```

## 6. Deploy — Render.com

Blueprint: [`render.yaml`](./render.yaml). Create a new Blueprint service in
Render, point it at the repo, and fill in the env vars marked `sync: false`.
Render mounts a 10 GB persistent disk at `/opt/render/project/src/server`, so
audio/image/PDF uploads survive redeploys.

## 7. Deploy — DigitalOcean App Platform

Blueprint: [`.do/app.yaml`](./.do/app.yaml). Install `doctl`, then:

```bash
doctl apps create --spec server/.do/app.yaml
# … note the returned APP_ID …
doctl apps update <APP_ID> --spec server/.do/app.yaml
```

### Required secrets (dashboard → App → Settings → Environment)

Mark these `SECRET`:

- `MONGO_URI` — Atlas SRV connection string
- `REDIS_URL` — `rediss://…` for any managed Redis (or omit and set
  `REDIS_ENABLED=false`)
- `ADMIN_PASSWORD` — rotate from the dev default
- `CORS_ORIGIN` — your public front-end origin(s), comma-separated
- `PUBLIC_BASE_URL` — e.g. `https://little-bible-stories-xxxx.ondigitalocean.app`

Plain vars are already defined in the spec (`NODE_ENV`, `PORT`, `LOG_LEVEL`,
`REDIS_ENABLED`, `CACHE_TTL_SECONDS`, `ADMIN_USER`, `TRANSLATION_ENABLED`,
`AUDIOBOOKS_DIR`, `UPLOADS_DIR`, `HF_HOME`).

### MongoDB Atlas network access

Add DigitalOcean's egress IPs to the Atlas IP allow-list, or `0.0.0.0/0` if
that isn't feasible for your region. Keep TLS enabled (the default for `+srv`
URIs).

### Storage caveat

App Platform containers are **ephemeral**. Files written to
`AUDIOBOOKS_DIR` / `UPLOADS_DIR` survive the lifetime of a single deployment
but are wiped on redeploy and are not shared between multiple instances. The
spec pins `instance_count: 1` so the ephemeral filesystem stays coherent
between requests. For durable storage, switch to DO Spaces (S3-compatible)
and refactor `UploadService` — see `security.md` for the open follow-up.

### First request warm-up

The translation service downloads ~1.2 GB of NLLB-200 weights on first call
into `HF_HOME`. Budget at least 2 GB of RAM (`basic-s` slug or larger); the
first `/api/translate` call takes ~30 s.

## 8. What to do when something breaks

- **401 on `/admin`** — password mismatch. Check `ADMIN_PASSWORD` in the
  running environment, not just in `.env`.
- **500 on every request** — inspect `logs/errors.log` (or the platform's log
  stream). The usual culprits are a missing `MONGO_URI` or an unreachable
  Redis; both log the cause at `error` level on boot.
- **Admin UI bounce to `/admin/`** — hit `/admin` (no trailing slash). Static
  redirects are disabled by design so the basic-auth guard runs first.
- **`doctl` can't read the spec** — ensure YAML indentation is all spaces, no
  tabs, and that the file is UTF-8 without BOM.
