# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Monorepo with three independent projects (no shared code or root tooling): `bot/` (Node), `backend/` (Go), `miniapp/` (React frontend for the Zalo Mini App). Run commands from inside each project directory. Code comments, log messages, user-facing text and READMEs are in Vietnamese — keep that convention.

## bot/ — document crawler → Telegram

Node ≥20, ESM, no build step, no linter. Tests use the built-in `node:test` runner.

```bash
npm start                 # bot mode: Telegram commands + cron crawl (loads .env via --env-file-if-exists)
npm run crawl             # one crawl, sends to Telegram
npm run crawl:dry         # one crawl, saves to data/ only, does NOT write data/seen.json
npm test                  # all tests in test/
node --test agent/tinyfish.test.js                       # single file
node --test --test-name-pattern="402" agent/             # single test by name
LOG_LEVEL=debug npm run crawl:dry                       # per-request / per-image logs
```

### Pipeline (`src/crawler.js`)

For each source → for each item: skip if in `Store` → `item.load()` → download images (JPEG/PNG only) + source PDF → **drop items with no media** → `classify()` → `saveItem()` renders `giai-thich.pdf` into `data/docs/<Region>/<Type>/<title>/` → `telegram.sendItem()` → `store.mark()` + save after every item.

- **Sources** (`src/sources/*.js`) are async generators `fetchX(log)` yielding `{ id, source, lang, query, title, url, load }`. `load()` is lazy and returns `{ text, images: [{url, description, license, artist, ...}], file }` so known items never hit the network. Register new sources in the `SOURCES` map in `crawler.js`; search keywords live in `src/queries.js`. `sources/wikimedia.js` holds shared MediaWiki helpers (`IMAGE_PROPS`, `toImage`, junk-image filter).
- **Classification** (`src/classify/index.js`) picks one provider at startup: `TINYFISH_API_KEY` → `OPENAI_API_KEY` → keywords. Keywords always run first; `hits === 0` skips the paid AI call. AI errors fall back to keywords with `fallback: true`, and fallback-irrelevant items are **not** marked in the store so they get re-checked later. 401/403 disables AI for the process; quota errors (402, 429 + credit/quota/billing) pause AI for 1h; transient errors retry with backoff.
  - Both providers share `SCHEMA` and `SYSTEM` exported from `classify/openai.js`. Fields must map to `REGIONS`/`TYPES` keys in `classify/categories.js` (which also holds `EXPLANATIONS`, the default per-type text used for keyword results).
  - TinyFish (`classify/tinyfish.js`) is a web agent, not an LLM: it opens `doc.url` and returns JSON via `output_schema`. Its schema subset rejects `description`/`additionalProperties`, so `toOutputSchema()` strips them and field descriptions move into the `goal`. Don't send `agent_config.max_steps` (403 for non-beta accounts). Timeouts are not retried because `/run` cannot be cancelled (double charge).
- **Bot mode** (`src/index.js`): `/start`, `/crawl`, `/stop`, `/resume`, `/stats`, owner-only by `TELEGRAM_CHAT_ID`. One crawl at a time (`current` AbortController); `/stop` aborts via `crawl({ signal })` after the current item and persists `{ paused }` in `data/bot-state.json`. Opens an HTTP health server only when `PORT` is set (needed by hosting platforms).
- **State is file-based in `data/`** (`seen.json`, `bot-state.json`, `docs/`). Hosts without a persistent disk lose it on restart → duplicates and repeated paid AI calls.
- `src/http.js` `getJSON`/`download` retry on 429/5xx honoring `Retry-After` and send a User-Agent with `BOT_CONTACT` (Wikimedia requires it). `REQUEST_DELAY_MS` throttles between requests.
- `src/pdf.js` uses pdfkit with `fonts/NotoSansCJKsc-*.otf` so Vietnamese and Chinese render; tests generate a real PDF.

Docker: `docker compose up -d --build` (mounts `./data`, `TZ=Asia/Ho_Chi_Minh` for cron).

## backend/ — Go + Gin + GORM/Postgres, Zalo Mini App login

```bash
cp .env.example .env      # JWT_SECRET, ZALO_APP_SECRET
make db-up                # Postgres via docker compose
make run                  # :8080 (HTTP_PORT)
make test                 # go test ./...
go test ./pkg/token -run TestName            # single test
```

Feature packages under `internal/modules/<name>/` hold only model/repository/service/handler — no wiring, no routes. All construction (clients, repos, services, handlers, `RequireAuth` middleware) lives in `internal/di/container.go` (`NewContainer`, built in `cmd/api/main.go`). Routes are declared centrally: `internal/routes/routes.go` calls one `<name>Routes(api, c)` per module, each in its own file `internal/routes/<name>.go`, using handlers from the container; protected routes add `c.RequireAuth`, and handlers read the user with `middleware.UserID(c)`. Tables are listed in `internal/database/migrate.go` (AutoMigrate at startup). `server.New(cfg, container)` only sets up Gin, CORS and mounts `routes.Register`. `pkg/` holds business-free clients (`token` JWT, `zalo` Graph API with `appsecret_proof`).

Login flow: mini app `getAccessToken()` (zmp-sdk) → `POST /api/v1/auth/zalo {"access_token"}` → backend verifies with `graph.zalo.me/v2.0/me`, upserts user, returns `{token, user}`.

## miniapp/ — React 19 + TS + TanStack Query v5 + Vite, yarn (classic)

```bash
yarn dev                  # :3000, needs VITE_API_BASE_URL in .env
yarn test                 # vitest + Testing Library (jsdom)
yarn lint && yarn typecheck
yarn vitest run -t "tên test"   # single test
```

Clean architecture per feature in `src/features/<name>/{domain,application,infrastructure,presentation}`; ESLint enforces that `domain`/`application` import no React/TanStack/infrastructure/presentation/app. `src/app/di/container.ts` is the only place that wires implementations; hooks get use cases via `useDeps()`. Query keys live in `presentation/<name>Keys.ts`. DTOs mirror the backend's snake_case JSON and are mapped to camelCase entities in `infrastructure/`. TypeScript is pinned to 6.x because typescript-eslint does not support TS 7 yet.
