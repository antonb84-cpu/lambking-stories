# LambKing — Server

Production-grade Node.js + TypeScript + Express backend for the LambKing
Vue 3 app. Ships with:

- Mongoose over MongoDB Atlas for metadata
- Redis cache on the hot read path, auto-invalidated on writes
- Filesystem-backed static hosting for OGG audiobooks, images, and PDFs
- HTTP Basic-Auth-gated `/admin` surface (a glassmorphism Vue 3 SPA) for authoring
- Server-side German ↔ English translation via `@huggingface/transformers`
  (NLLB-200-distilled-600M — no 3rd-party API)

## Quick start

```bash
# From the repo root
pnpm install

cp server/.env.example server/.env
# Fill MONGO_URI, REDIS_URL, ADMIN_PASSWORD in server/.env

pnpm --filter little-bible-stories-server dev       # :4000
pnpm --filter little-bible-stories-adminui dev      # :5173 → proxies /api to :4000
```

Then visit <http://localhost:5173> and log in with the basic-auth credentials you
set in `.env` (`ADMIN_USER` / `ADMIN_PASSWORD` — there is no default password).

The server also serves the built admin UI at <http://localhost:4000/admin>.

## Verification

```bash
curl http://localhost:4000/healthz
# → { "ok": true, "mongo": true, "redis": true }

curl http://localhost:4000/api/books
# → { "books": [...] }  (cached after first hit)
```

## Architecture

Three-layer. Requests flow routes → controllers → services → models.

```
src/
  config/   env, logger, db, redis, security (helmet/CSP)
  models/   Mongoose schemas (Book, BookSeries, Category)
  validators/ Zod schemas for every write endpoint
  services/ BookService, SeriesService, CategoryService,
            UploadService, CacheService, TranslationService
  controllers/ thin adapters between HTTP and services
  routes/   Express routers mounted under /api
  middleware/ auth, validate, errorHandler, requestLogger,
              rateLimit, upload
  utils/    bookId, seriesPrefix, slug, asyncHandler, httpError
```

## Data model

```ts
Book
{
  bookId: "fa-1-apple"     // ^[a-z]{2}-\d+-[a-z0-9-]+$
  author, category, bookSeriesId, releaseDate, updatedDate
  badges[], cover ?, coverImage, previewImage, contentCoverImage ?
    audio : { de?, en? }
  attachments: string[]
  localizations: {
    de: {
      title, shortDescription, description, content
    :
      [{ page, title, text }]
    }
  ,
    en: {
      title, shortDescription, description, content
    :
      [{ page, title, text }]
    }
  }
  isPublished
}

BookSeries
{
  seriesId, name, prefix(2
  letters, unique
),
  description ?
}
Category
{
  name(unique)
}
```

## Endpoints

See [`docs/API.md`](./docs/API.md) for the full reference. High level:

| Method | Path                      | Auth  |
|--------|---------------------------|-------|
| GET    | /api/books                | —     |
| GET    | /api/book/:id             | —     |
| POST   | /api/books                | basic |
| PUT    | /api/book/:id             | basic |
| DELETE | /api/book/:id             | basic |
| GET    | /api/book-series          | —     |
| POST   | /api/book-series          | basic |
| PUT    | /api/book-series/:id      | basic |
| DELETE | /api/book-series/:id      | basic |
| GET    | /api/categories           | —     |
| POST   | /api/categories           | basic |
| DELETE | /api/categories/:name     | basic |
| POST   | /api/audiobooks           | basic |
| POST   | /api/images               | basic |
| POST   | /api/attachments          | basic |
| POST   | /api/translate            | basic |
| GET    | /audiobooks/*, /uploads/* | —     |
| GET    | /admin                    | basic |
| GET    | /healthz                  | —     |

All write endpoints go through the Zod validator and the strict rate limiter.

## Scripts

```bash
pnpm --filter little-bible-stories-server dev          # tsx watch
pnpm --filter little-bible-stories-server build        # tsc → dist/
pnpm --filter little-bible-stories-server start        # node dist/index.js
pnpm --filter little-bible-stories-server test         # vitest (includes supertest)
pnpm --filter little-bible-stories-server type-check   # tsc --noEmit
```

## Tests

- **Server**: Vitest + supertest + mongodb-memory-server + ioredis-mock. Every
  endpoint has at least one 2xx + one validation-failure test.
- **Admin UI**: Vitest + @vue/test-utils + jsdom. Each organism has a unit test for
  the behavior called out in the plan (submit gating, drop zone transitions,
  chapter detection, swipe, translate-on-switch, prefix collision UX).

## Postman

Import `postman/little-bible-stories.postman_collection.json` and the matching
environment file. Set `{{baseUrl}}`, `{{adminUser}}`, `{{adminPassword}}` in the env —
the collection's pre-request script applies basic-auth to every secured call.

## Security

Strict Helmet CSP, rate limits, input sanitization, Zod validation, Basic Auth, file
upload MIME + size whitelist. Full details in [`security.md`](./security.md).

## Deploy

Render.com blueprint at [`render.yaml`](./render.yaml). GitHub Actions runs type-check
and tests on every push; `main` triggers the Render deploy hook.
