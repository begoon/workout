# workout

Personal single-user workout set tracker. SvelteKit app on Vercel, Redis for storage.

## Stack

- **SvelteKit 2** with **Svelte 5 runes** (`$state`, `$props`, `$effect`, `$derived`). Runes mode is forced in `svelte.config.js`.
- **Bun** as package manager + runner (`bun.lock`, not `package-lock.json`).
- **TypeScript** strict.
- **Vercel** deploy via `@sveltejs/adapter-vercel`, `nodejs22.x` runtime.
- **Redis** (Vercel Marketplace integration) via `redis` npm package. Single client reused across serverless invocations.
- **PWA**: web manifest + service worker + iOS meta tags; installable on iOS/Android.

## Commands

```
bun run dev       # dev server
bun run check     # svelte-kit sync + svelte-check
bun run build     # production build
just backup       # pull Redis dump to backup-YYYY.MM.DD-HH.MM.SS.json
```

`Justfile` at repo root wraps the above; see also `.github/workflows/backup.yaml` for the daily 07:00 UTC backup.

## Environment variables

All read via `$env/dynamic/private` (runtime, not build-time) — changing them on Vercel doesn't require a rebuild, just a new deployment for the function to restart.

- `REDIS_URL` — Redis connection string. Must be set for Production on Vercel.
- `AUTH_PASSWORD` — the login password.
- `AUTH_SECRET` — HMAC key for the auth cookie. Rotating it invalidates every existing cookie everywhere (effective "log everyone out" switch). Generate with `openssl rand -hex 32`.

Without `AUTH_SECRET` or `AUTH_PASSWORD` set, nobody can log in (by design — `issueAuthToken()` returns an empty string, `isAuthCookieValid` always returns false).

## Data model (Redis)

All keys live under the `workout:` umbrella so the same Redis can host other projects.

- `workout:day:YYYY-MM-DD` — Redis **Hash**, field = exercise name, value = stringified count. Atomic `HINCRBY` on +/− so concurrent devices don't clobber each other. Fields with value 0 are deleted rather than stored.
- `workout:exercises` — JSON string, array of exercise names. Absent → fall back to `DEFAULT_EXERCISES` in `src/lib/exercises.ts`.

When a day has no non-zero entries, the whole `workout:day:X` key is allowed to disappear (not a business rule, just a side effect).

## Architecture

### Server

- `src/hooks.server.ts` — request gate. Checks cookie; page requests without auth → `303 → /login?from=…`; `/api/*` → `401`. Public allowlist: `/login`, `/_app/*`, manifest, icons, service worker.
- `src/lib/server/redis.ts` — singleton `createClient` behind `getRedis()`. Key helpers (`dayKey`, `EXERCISES_KEY`) and `toDayLog` normaliser.
- `src/lib/server/auth.ts` — stateless auth. `TOKEN = HMAC_SHA256(AUTH_SECRET, AUTH_PASSWORD)` computed once. `verifyPassword` + `isAuthCookieValid` both use `timingSafeEqual`.
- `src/routes/api/`
  - `day/[date]/+server.ts` → `GET` → `DayLog`.
  - `day/[date]/bump/+server.ts` → `POST {exercise, delta}` → new `DayLog`. Delta > 0 uses `HINCRBY`; delta < 0 reads → clamps to 0 → either `HDEL` or `HSET`.
  - `range/+server.ts` → `GET ?from&to` → pipelined `HGETALL` for each date in the inclusive range (capped at 400 days).
  - `exercises/+server.ts` → `GET` / `PUT`. PUT normalises (trim, lowercase, dedupe, regex-validate, cap 64).

### Client

- `src/lib/storage/index.ts` — thin `fetch` wrapper. Every call throws on non-2xx. **No localStorage, no offline writes.** Intentional — see "Offline" below.
- `src/lib/DayEditor.svelte` — reusable day editor. Takes `date` prop. Fetches day + exercise list in parallel. Optimistic `bump` with rollback + `alert()` on failure.
- `src/routes/+page.svelte` — calendar grid. 42 days, newest first. Alternates background tint by month parity. Today gets an accent-tinted square. Squares link to `/day/[date]`. Refetches on `visibilitychange`.
- `src/routes/today/+page.svelte` — thin wrapper: `<DayEditor date={todayISO()} />`.
- `src/routes/day/[date]/+page.svelte` — same, keyed by URL param so re-nav remounts the editor.
- `src/routes/exercises/+page.svelte` — list editor with add / remove / reorder. Optimistic with rollback.
- `src/routes/login/+page.svelte` — password-only form; `autocomplete="current-password"` for iOS Keychain / 1Password.
- `src/routes/+layout.svelte` — nav + dark theme + safe-area-insets. Nav hidden on `/login`.

### PWA

- `static/manifest.webmanifest` — all recommended fields, both `any` and `maskable` SVG icons.
- `static/icon.svg` + `static/icon-maskable.svg` — placeholder dumbbell art. Replace with PNG icons (192 / 512) for broader compat.
- `src/app.html` — iOS meta tags (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style=black-translucent`, `apple-touch-icon`, `viewport-fit=cover`).
- `src/service-worker.ts` — SvelteKit's built-in SW slot. Strategy: skip `/api/*` (always fresh), cache-first for pre-cached build assets, network-first with cache fallback for HTML.

## Conventions

- **Runes everywhere** in Svelte. No stores, no `$:` labels.
- **Exercise names**: lowercase, validated against `/^[a-z0-9][a-z0-9 _-]{0,31}$/`.
- **Dates**: `YYYY-MM-DD` in local time; `todayISO()` helper in `src/lib/storage/types.ts`.
- **Exercise list ∩ day log**: editor iterates the master list (zero-fills missing exercises, enables retroactive logging). Calendar grid iterates only the day's stored hash keys — so removing an exercise from the master list leaves historical data intact and read-only.
- **Errors**: any storage failure surfaces via `alert()`. No silent fallbacks, no retry queues.

## Offline

Service worker gives you an offline-capable shell. **Writes do not queue**: tapping `+` without network throws, the UI rolls back, and an alert fires. This is intentional; adding offline mutation support would need an IndexedDB outbox + replay, which hasn't been built.

## Deployment

- Vercel project `workout`. Production branch: `main`.
- **Backup branch**: orphan branch `backup` (no shared history with `main`), populated by the daily GH Actions workflow. Ignored Build Step in Vercel prevents the `backup` branch from triggering deploys.
- Ignored Build Step command:
  ```
  if [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then exit 1; else exit 0; fi
  ```

## Gotchas

- Scheduled GH Actions run only from the default branch; if the workflow file lives anywhere else, nothing fires.
- `@sveltejs/adapter-auto` failed to bundle `redis` into the serverless function on Vercel — that's why the explicit `@sveltejs/adapter-vercel` is used.
- Redis v5's `scanIterator` yields batches (arrays), not individual keys. See `backup.ts` for the handle-both pattern.
- `@redis/client` tries to soft-load `@node-rs/xxhash` and `@opentelemetry/api` — build prints warnings about them being absent. Harmless; they're optional.
