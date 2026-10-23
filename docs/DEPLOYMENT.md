# Deployment

```text
                         ┌─────────────────────┐
                         │       GitHub        │
                         │   Source control    │
                         └─────────┬───────────┘
                                   │
                  ┌────────────────┴────────────────┐
                  ▼                                 ▼
          ┌───────────────┐                 ┌────────────────┐
          │    Vercel     │                 │ GitHub Actions │
          │ React frontend│                 │  CI / checks   │
          └───────┬───────┘                 └────────────────┘
                  │ HTTPS / REST
                  ▼
          ┌───────────────┐
          │    Render     │
          │ Node + Express│
          └───────┬───────┘
                  │ PostgreSQL (SSL)
                  ▼
          ┌───────────────┐
          │     Neon      │
          │  PostgreSQL   │
          └───────────────┘
```

Deploy in this order — the frontend needs the backend URL, and the backend needs
the database URL.

---

## 1. Database — Neon

1. Create a project at [neon.tech](https://neon.tech).
2. Neon gives you **two** connection strings for the same database, differing
   only by the `-pooler` suffix on the host. The backend needs both:

   | Variable | Endpoint | Used by |
   | -------- | -------- | ------- |
   | `DATABASE_URL` | `ep-xxxx**-pooler**.region.aws.neon.tech` | the running application |
   | `DIRECT_DATABASE_URL` | `ep-xxxx.region.aws.neon.tech` | Prisma Migrate |

   ```text
   DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/DB?sslmode=require&pgbouncer=true"
   DIRECT_DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/DB?sslmode=require"
   ```

`sslmode=require` is mandatory on both.

**Why two.** Neon serves the pooled endpoint through PgBouncer, which cannot
proxy the DDL a migration issues — running `prisma migrate deploy` against it
fails. `schema.prisma` therefore declares `directUrl`, and Prisma routes
migrations to the unpooled endpoint while the application keeps the benefit of
the pool. Prisma **errors if `DIRECT_DATABASE_URL` is unset** once `directUrl` is
declared; for a plain PostgreSQL with no pooler, set it to the same value as
`DATABASE_URL`.

> Neon suspends idle compute on the free tier. The first request after a pause
> can take a few seconds while the database wakes.

### Latency and transactions

A hosted database sits several hundred milliseconds away, and Prisma's default
interactive-transaction limit is 5 seconds — enough for a local database, not
always enough for a multi-line challan over the network. Two things address this:

- every stock adjustment is a single `UPDATE … RETURNING` statement, so a challan
  line costs two round trips rather than four
- transactional operations run with an explicit budget
  (`maxWait: 10s, timeout: 30s`) defined in `src/lib/prisma.ts`

Without both, confirming a challan against a remote database can fail with
Prisma error `P2028 — Transaction not found`.

---

## 2. Backend — Render

### Option A — the blueprint

The repository contains `render.yaml`. In Render choose **Blueprints → New
Blueprint Instance**, point it at the repository, then fill in the environment
variables marked `sync: false`.

### Option B — manual

**New → Web Service**, connect the repository and set:

| Setting | Value |
| ------- | ----- |
| Root directory | `backend` |
| Runtime | Node |
| Build command | `npm ci && npm run build` |
| Start command | `npx prisma migrate deploy && node dist/server.js` |
| Health check path | `/health` |

### Environment variables

| Key | Value |
| --- | ----- |
| `DATABASE_URL` | the Neon **pooled** connection string |
| `DIRECT_DATABASE_URL` | the Neon **direct** connection string (no `-pooler`) |
| `JWT_SECRET` | a long random string — generate with `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | `8h` |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | the Vercel URL, e.g. `https://mini-erp-crm.vercel.app` |
| `SEED_DEFAULT_PASSWORD` | the password for the seeded demo accounts |

`PORT` is provided by Render automatically.

### Seed the demo accounts

The start command applies migrations but does not seed. Run the seed once from
the Render shell:

```bash
npx tsx prisma/seed.ts
```

It is idempotent — users and customers are upserted, and products and challans
are only created when the tables are empty.

Verify: `https://<service>.onrender.com/health` returns
`{"success":true,"data":{"status":"ok","environment":"production"}}`.

> The Render free tier sleeps after inactivity, so the first request after an
> idle period is slow. This is a platform characteristic, not an application bug.

---

## 3. Frontend — Vercel

**Add New → Project**, import the repository and set:

| Setting | Value |
| ------- | ----- |
| Root directory | `frontend` |
| Framework preset | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |

### Environment variable

| Key | Value |
| --- | ----- |
| `VITE_API_BASE_URL` | `https://<service>.onrender.com/api` — note the `/api` suffix |

Vite inlines `VITE_*` variables **at build time**, so changing this value
requires a redeploy.

`frontend/vercel.json` already rewrites every path to `index.html` so client-side
routes such as `/challans/abc123` resolve on a hard refresh.

### Close the loop

After the frontend is live, set Render's `CORS_ORIGIN` to the Vercel URL and
redeploy the backend. Multiple origins can be given as a comma separated list —
useful when a preview deployment also needs access.

---

## 4. Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request to `main`:

1. **Backend** — typecheck (runtime sources and tests), `prisma migrate deploy`
   against a clean PostgreSQL service container, build, and the integration suite.
2. **Frontend** — lint, typecheck and a production build.
3. **Docker** — both images build, gated behind the two application jobs.

Vercel and Render deploy directly from GitHub; that is separate from Actions. To
gate deployments on CI, disable auto-deploy on each platform and trigger their
deploy hooks from a workflow step that runs after the checks pass.

---

## 5. Running the whole stack with Docker

```bash
# database only — the usual choice for development
docker compose up -d db

# database + API + web
docker compose --profile app up -d --build
```

| Service | URL |
| ------- | --- |
| Web | http://localhost:8080 |
| API | http://localhost:4000 |
| PostgreSQL | localhost:5432 |

The API container applies migrations before serving. Seed it once with:

```bash
docker compose exec api npx tsx prisma/seed.ts
```

Set `JWT_SECRET` in your shell (or an `.env` file next to `docker-compose.yml`)
before starting; the compose file falls back to a development value that must not
be used anywhere real.

---

## Post-deployment checklist

- [ ] `GET /health` on Render returns `ok`
- [ ] The Vercel app loads and the login screen renders
- [ ] Signing in as each of the four demo accounts succeeds
- [ ] The dashboard shows figures (seed has been run)
- [ ] Creating a customer, a product and a challan works from the deployed UI
- [ ] Confirming a challan reduces stock, and an over-request is rejected
- [ ] `CORS_ORIGIN` on Render matches the Vercel domain exactly
- [ ] No `.env` file is present in the repository
