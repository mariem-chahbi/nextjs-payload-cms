# nextjs-payload-cms

A production-minded starter for **Payload CMS 3 + Next.js 16**: a fully editable page builder, English ⇄ Arabic (RTL) by region, Postgres, MinIO storage and Docker. Everything runs locally, with no cloud services or paid APIs.

| | Version |
|---|---|
| Payload (`@payloadcms/*`) | 3.91.0, pinned (3.92+ needs Node ≥ 24.22.1) |
| Next.js / React | 16.4.3 / 19.2.6 (App Router, Turbopack) |
| Node / pnpm | 24.19.0 (`.nvmrc`) / 12 |
| Database | Postgres 16 (Drizzle adapter) |
| Files | MinIO over the S3 protocol (`@payloadcms/storage-s3`), never AWS |

## Features

- **Page builder:** 17 blocks: Hero, Rich text, Columns, Media + text, Image, Video, Gallery, Cards, Buttons, Stats, Testimonials, FAQ, Logos, CTA, Form, Spacer, Free layout.
  - Every block has a **Style** tab: spacing, colors, fonts, alignment, visibility per breakpoint and region.
  - Every image has a **shape** setting (ratio and cover/contain) that crops around its focal point.
  - Changes appear instantly in **Live Preview**, with drafts, autosave, versions and scheduled publishing.
- **Site editing:** header, footer, theme (colors, fonts) and site settings are all edited in the admin; no texts are hard-coded.
- **Content dashboard:** quick actions, pages that need attention, recent edits, and counts of media, documents and form submissions.
- **Languages and regions:**
  - Locales `en`, `ar`, `ar-TN` and `en-TN`. Arabic pages are right-to-left.
  - Fallback chains `ar-TN → ar → en` and `en-TN → en`, so a region stores only what differs.
  - A region and language switcher on the site.
- **Translation workflow:**
  - A side-by-side Translation view, with a status per language (missing / needs review / done).
  - Auto-translate through a local LibreTranslate, or DeepL.
  - A grid for editing UI strings, and CSV / XLSX / JSON import and export.
- **Roles:** admin, editor, translator, viewer. Translators can only edit translated text as drafts; structural changes are rejected on the server.
- **Storage:** a private MinIO bucket. Media is served through Payload; documents open through 5-minute signed URLs.

## Quick start

```bash
nvm use                      # Node 24.19.0
cp .env.example .env         # set PAYLOAD_SECRET to a long random string
docker compose up -d         # Postgres, MinIO (+ bucket/user), Mailpit, LibreTranslate
pnpm install
pnpm seed                    # demo users, regions, pages and media
pnpm dev                     # site http://localhost:3000 · admin http://localhost:3000/admin
```

The first `docker compose up` downloads LibreTranslate's language models, which takes a few minutes.

| Service | Address |
|---|---|
| Site / admin | http://localhost:3000 · `/admin` |
| Postgres | `localhost:5434` (db `payload_playground`, user/password `payload`) |
| MinIO API / console | http://localhost:9200 / http://localhost:9201 |
| Mailpit (all emails) | http://localhost:8025 |
| LibreTranslate | http://localhost:5000 (if the port is taken, change `LIBRETRANSLATE_PORT` and `LIBRETRANSLATE_URL`) |

**Seeded logins** (the password is the role followed by `-playground`):

| Role | Email | Can |
|---|---|---|
| admin | `admin@payload-playground.local` | everything, including users |
| editor | `editor@payload-playground.local` | create, edit and publish content |
| translator | `translator@payload-playground.local` | translate non-English locales, as drafts only |
| viewer | `viewer@payload-playground.local` | read through the API; no admin panel |

## Project structure

```
src/
  payload.config.ts      collections, globals, localization, admin views, jobs
  env.ts                 validated env; refuses a missing or AWS MINIO_ENDPOINT
  storage.ts             MinIO adapter (public media, signed documents)
  proxy.ts               locale routing (cookie, then Accept-Language)
  blocks/<Name>/         config.ts (admin fields) + Component.tsx (site)
  fields/                Style tab, links, image shape, fonts, colors
  collections/ globals/  Pages, Media, Documents, Regions, Translations, Users / Site settings, Theme, Header, Footer
  access/ plugins/       roles, translator guard, SEO, forms, storage, translation status
  i18n/ translation/     locales and fallback, auto-translate, import/export, progress
  components/admin/      dashboard, Translation view, UI strings grid, import/export
  components/site/       header, footer, switcher, media, rich text
  app/(frontend)/[locale]/  the public site
  seed/ migrations/      demo content, committed migrations
tests/                   vitest unit tests · tests/e2e Playwright
```

## Scripts

| Script | Does |
|---|---|
| `pnpm dev` · `build` · `start` | development server, production build, start |
| `pnpm typecheck` · `lint` · `test` | TypeScript, ESLint, vitest (no Docker needed) |
| `pnpm test:e2e` | Playwright smoke tests (needs the stack and the seed; `E2E_CHANNEL=msedge` uses Edge) |
| `pnpm seed` | reset and seed demo content (can be re-run) |
| `pnpm migrate` · `migrate:create <name>` | run / create migrations |
| `pnpm generate:types` · `generate:importmap` | regenerate Payload types / the admin import map |

## Deployment (Docker)

```bash
docker compose --profile app up -d --build
DATABASE_URL=postgres://payload:payload@localhost:5434/payload_playground_app NODE_ENV=production pnpm seed
```

- The image is a standalone Next.js build on `node:24.19.0-alpine` and needs no database at build time.
- **Dev** pushes the schema automatically. **Production** applies the committed migrations at startup. After changing fields, run `pnpm migrate:create <name>`.
- The Docker app has its own database and its own MinIO folder (`MINIO_PREFIX=app`), so it never touches dev content.

## Extending

- **New block:**
  1. Add `src/blocks/<Name>/config.ts` (with `defineBlock`) and `Component.tsx`.
  2. Register it in `src/blocks/index.ts` and `registry.ts`.
  3. Add a sample to `tests/blocks.test.tsx`.
  4. Run `pnpm generate:types && pnpm migrate:create <name>`.

  Its localized fields show up in the translation tools on their own.
- **New region:** in the admin, go to *Localization → Regions → Create*. No code is needed.
- **New locale code:** add it to `LOCALES` in `src/i18n/locales.ts`, then run `pnpm generate:types && pnpm migrate:create <name>`.

## Implementation notes

- **Give each blocks field its own copy of the block configs** (`copyConfig`). Payload sanitizes configs in place, so a shared object loses `localized` on its fields.
- **Pass a new `context` object to each Local API call.** Payload uses it as `req.context`, and the storage plugin keeps upload state there.
- **Only `translations` has per-field access rules.** Payload evaluates field access on every admin request; rules on every block field made admin views take 15–30 s. Other collections rely on the translator guard instead.
- **Dev mode is slower than production.** Each admin view compiles on first visit. Run `pnpm build` to measure real speed. If Turbopack reports a stale module, delete `.next` and restart.
- **Calling the API from curl or scripts:** use `Authorization: JWT <token>`. The session cookie only works with an `Origin` or `Sec-Fetch-Site` header.
