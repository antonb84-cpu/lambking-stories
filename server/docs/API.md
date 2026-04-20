# API Reference

Base URL in local dev: `http://localhost:4000`. All JSON. Errors follow a unified
envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "localizations.de.title",
        "message": "must be a non-empty string"
      }
    ]
  }
}
```

Error codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`,
`PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`, `RATE_LIMITED`, `INTERNAL`,
`TRANSLATION_DISABLED`.

## Auth

All write endpoints and `/admin` require HTTP Basic Auth with
`Authorization: Basic base64(user:password)`.

---

## Health

### GET /healthz

Public. Returns runtime health.

```json
{
  "ok": true,
  "mongo": true,
  "redis": true,
  "uptime": 42.18
}
```

---

## Books

### GET /api/books

Public. Cached under Redis key `books:all` for `CACHE_TTL_SECONDS` (default 600 s).

**200**

```json
{
  "books": [
    {
      "bookId": "fa-1-apple",
      "author": "...",
      ...
    }
  ]
}
```

### GET /api/book/:bookId

Public. Cached under `book:<id>`.

**200**

```json
{
  "book": {
    "bookId": "fa-1-apple",
    ...
  }
}
```

**404** — `NOT_FOUND` when no book matches.

### POST /api/books

Basic auth.

**Body** (JSON, strict — unknown fields rejected)

```json
{
  "bookId": "fa-1-apple",
  "author": "Konstantin Steinmiller",
  "category": "Früchte",
  "bookSeriesId": "fruit-agents",
  "releaseDate": "2026-01-15",
  "badges": [
    "Neu"
  ],
  "cover": null,
  "coverImage": "http://localhost:4000/uploads/covers/abc123.webp",
  "previewImage": "http://localhost:4000/uploads/previews/def456.webp",
  "contentCoverImage": null,
  "audio": {
    "de": "http://localhost:4000/audiobooks/de/fa-1-apple.ogg",
    "en": null
  },
  "attachments": [],
  "localizations": {
    "de": {
      "title": "Der Apfel",
      "shortDescription": "Kurz",
      "description": "Lang",
      "content": [
        {
          "page": 1,
          "title": "Seite 1",
          "text": "<p>...</p>"
        }
      ]
    },
    "en": null
  },
  "isPublished": false
}
```

**201**

```json
{
  "book": {
    ...created
    book...
  }
}
```

**400** — `VALIDATION_ERROR` with per-field `details`.
**409** — `CONFLICT` when `bookId` already exists.

### PUT /api/book/:bookId

Basic auth. Partial update — pass only the fields you want to change. Invalidates
`books:all` and `book:<id>`.

**200** returns the updated book.

### DELETE /api/book/:bookId

Basic auth. Invalidates `books:all` and `book:<id>`.

**204** no content.
**404** — `NOT_FOUND`.

---

## Book Series

### GET /api/book-series

Public. Returns all series sorted by `name`.

### POST /api/book-series

Basic auth.

**Body**

```json
{
  "name": "Fruit Agents",
  "description": "optional",
  "prefix": "fa"
}
```

`prefix` is optional. The server auto-derives it from the first two lowercase letters
of the name if omitted. On collision it responds:

**409**

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "prefix \"fa\" is already taken",
    "details": [
      {
        "field": "prefix",
        "message": "taken — try: fr, fg, ft"
      }
    ]
  }
}
```

### PUT /api/book-series/:seriesId / DELETE /api/book-series/:seriesId

Basic auth. DELETE rejects (409) if any book references the series.

---

## Categories

### GET /api/categories

Public.

### POST /api/categories

Basic auth.

```json
{
  "name": "Früchte"
}
```

### DELETE /api/categories/:name

Basic auth.

---

## Uploads

All upload endpoints accept `multipart/form-data` with a `file` field. The server
replaces the filename with a SHA-1 hash of the buffer and returns the public URL.

### POST /api/audiobooks?bookId=fa-1-apple&lang=de

Basic auth. 50 MB cap. `audio/ogg` only. Stored at
`audiobooks/<lang>/<bookId>.ogg`.

**201**

```json
{
  "url": "http://localhost:4000/audiobooks/de/fa-1-apple.ogg"
}
```

### POST /api/images?kind=cover|preview|content

Basic auth. 5 MB cap. `image/webp`, `image/jpeg`, `image/png`.

**201**

```json
{
  "url": "http://localhost:4000/uploads/covers/<hash>.webp"
}
```

### POST /api/attachments

Basic auth. 25 MB cap. `application/pdf`.

**201**

```json
{
  "url": "http://localhost:4000/uploads/attachments/<hash>.pdf",
  "filename": "original.pdf"
}
```

---

## Translation

### POST /api/translate

Basic auth. Translates a map of strings while preserving keys.

**Body**

```json
{
  "from": "de",
  "to": "en",
  "strings": {
    "title": "Der Apfel",
    "shortDescription": "Ein einfaches Obst.",
    "content.1.title": "Seite 1",
    "content.1.text": "Ein Apfel am Tag..."
  }
}
```

**200**

```json
{
  "strings": {
    "title": "The apple",
    "shortDescription": "A simple fruit.",
    "content.1.title": "Page 1",
    "content.1.text": "An apple a day..."
  }
}
```

**503** `TRANSLATION_DISABLED` when `TRANSLATION_ENABLED=false` or the model failed to
load.

---

## Static assets

- `GET /audiobooks/<lang>/<bookId>.ogg` — supports `Range` headers for seeking.
- `GET /uploads/covers/<hash>.webp`
- `GET /uploads/previews/<hash>.webp`
- `GET /uploads/content-images/<hash>.webp`
- `GET /uploads/attachments/<hash>.pdf`

All public, served with `Cache-Control: public, max-age=31536000, immutable` because
URLs are content-hashed.

---

## Admin SPA

### GET /admin

Basic auth. Serves the admin UI SPA (built into `public/admin/`). History-fallback is
enabled so deep links to `/admin/...` work after a reload.

---

## Rate limits

| Bucket                   | Limit     |
|--------------------------|-----------|
| Public reads             | 100 / min |
| Writes (POST/PUT/DELETE) | 30 / min  |
| Translation              | 20 / min  |

When exceeded, returns **429** with `RATE_LIMITED`.
