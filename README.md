# Mini ERP & CRM Operations Portal

Live Demo: https://mini-erp-crm-operations-portal-jade.vercel.app/login

A full-stack ERP/CRM portal for Indian wholesale businesses to manage customers, inventory, stock movements, sales challans, and role-based access using React, Node.js, Express, TypeScript, PostgreSQL, and Prisma.

## Features
- Customer relationship management
- Product and inventory management
- Sales challan management
- Role-based authentication
- Operations dashboard

# Mini ERP + CRM Operations Portal

A focused ERP/CRM system for a wholesale/distribution company. Internal staff —
Sales, Warehouse, Accounts and Admin — manage customers, products, stock and
sales challans from one responsive portal, with the business rules enforced on
the server.

---

## Contents

- [Overview](#overview)
- [Features](#features)
- [Technology](#technology)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Test credentials](#test-credentials)
- [Business rules](#business-rules)
- [API](#api)
- [Testing](#testing)
- [Docker](#docker)
- [Continuous integration](#continuous-integration)
- [Deployment](#deployment)
- [Known limitations](#known-limitations)

---

## Overview

### Business context

The company buys in bulk and sells on to retailers, wholesalers and
distributors. Its desks need one system that answers:

- Who are our customers, which are still leads, and who is due a call?
- What is on the shelf right now, and what needs reordering?
- What went out of the door, to whom, at what price?

The portal covers exactly that flow — customer relationship through to
dispatch — and deliberately stops there rather than growing into a general ERP.

### Roles

| Role | Responsibility |
| ---- | -------------- |
| **Admin** | Full access to every module |
| **Sales** | Owns the customer relationship and raises sales challans |
| **Warehouse** | Owns the product catalogue and physical stock movements |
| **Accounts** | Read-only visibility across customers, stock and challans |

---

## Features

### Authentication and roles

- JWT authentication; passwords are only ever stored as bcrypt hashes
- A single capability table maps each permission to the roles that hold it, so
  every route declares what it needs instead of repeating role lists
- The resolved capability set is returned with the profile, letting the frontend
  render role-appropriate navigation while the server stays authoritative
- The user is re-read on every request, so a deactivated account loses access
  immediately rather than when its token expires

### Customer CRM

- Name, mobile, email, business name, GST number, type, address, status,
  follow-up date and notes
- Create, edit, search (name, business, mobile, email, GST), filter by status and
  type, sort and paginate
- Customer detail with the full account history
- Follow-up notes; logging one with a next date advances the customer's follow-up
  date in the same transaction
- A "follow-ups due" view, surfaced as a live count in the sidebar

### Products and inventory

- Name, SKU, category, unit price, current stock, minimum stock alert and
  location
- Create and edit products, with search, category/location filters and a
  low-stock view
- A complete stock movement ledger — product, quantity, IN/OUT, reason, resulting
  balance, who and when
- Stock is only ever changed by a recorded movement, so the ledger always
  reconciles with the product

### Sales challans

- Select a customer, add multiple products with quantities
- Challan numbers generated automatically as `CH-YYYYMM-NNNN`
- Save as **Draft** or **Confirmed**; confirming releases stock
- Cancelling a confirmed challan returns the stock
- Every line stores a **product snapshot** so the document stays accurate after
  the catalogue changes

### Operations dashboard

Revenue against the preceding period, challan and stock headline figures, top
customers and products, desk performance, a six-month trend, low-stock alerts and
due follow-ups — all from one request.

---

## Technology

| Layer | Technology |
| ----- | ---------- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router, lucide-react |
| Backend | Node.js 20, Express 4, TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma 5 |
| Validation | Zod |
| Authentication | JWT (`jsonwebtoken`) + bcrypt |
| Testing | Vitest + Supertest against a real PostgreSQL database |
| Hosting | Vercel (frontend), Render (backend), Neon (database) |
| Bonus | Docker, Docker Compose, GitHub Actions |

---

## Architecture

```text
React SPA (Vercel)
      │  fetch + Bearer token
      ▼
Express REST API (Render)
      │  authenticate → authorize → validate → controller → service
      ▼
Prisma ORM
      ▼
PostgreSQL (Neon)
```

Each request passes through the same chain:

1. **`authenticate`** — verifies the bearer token and reloads the user
2. **`authorize(capability)`** — checks the capability table
3. **`validate({ body, query, params })`** — parses with Zod and *replaces* the
   request data with the parsed, coerced, trimmed values
4. **Controller** — unwraps the request and shapes the response
5. **Service** — the business logic, including all transactional work
6. **Error handler** — turns any failure into the standard error envelope

Keeping the rules in services rather than controllers is what lets the challan
flow and the manual stock adjustment share one stock engine, and is why both are
equally protected against negative stock.

---

## Project structure

```text
mini-erp-crm/
├── backend/
│   ├── prisma/
│   │   ├── migrations/          SQL migrations
│   │   ├── schema.prisma        data model
│   │   └── seed.ts              demo users, customers, products, challans
│   ├── src/
│   │   ├── config/              validated env, capability table
│   │   ├── lib/                 PrismaClient singleton
│   │   ├── middleware/          authenticate, authorize, validate, errors
│   │   ├── modules/             auth, customers, products, inventory,
│   │   │                        challans, dashboard — schema/service/
│   │   │                        controller/routes per module
│   │   ├── routes/              API router
│   │   ├── utils/               ApiError, pagination, validators, jwt, password
│   │   ├── app.ts               Express application
│   │   └── server.ts            HTTP entry point
│   ├── tests/                   integration tests + helpers
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/          bar and trend charts
│   │   │   ├── inventory/       stock movement dialog
│   │   │   ├── layout/          shell, header, sidebar, navigation
│   │   │   ├── routing/         route guards
│   │   │   └── ui/              the design system primitives
│   │   ├── context/             auth and toast providers
│   │   ├── hooks/               data fetching, URL-backed list state
│   │   ├── lib/                 API client, formatting, labels
│   │   ├── pages/               one folder per module
│   │   └── types/               API response types
│   ├── nginx.conf               SPA serving for the Docker image
│   ├── vercel.json
│   └── Dockerfile
│
├── docs/
│   ├── API.md                   full endpoint reference
│   ├── DEPLOYMENT.md            Vercel / Render / Neon walkthrough
│   └── postman/                 collection + environment
│
├── .github/workflows/ci.yml
├── docker-compose.yml
└── render.yaml
```

---

## Getting started

### Prerequisites

- Node.js 20 or newer
- Docker (for the local PostgreSQL), or any PostgreSQL 14+ instance

### 1. Clone and install

```bash
git clone <repository-url>
cd mini-erp-crm
npm run install:all
```

### 2. Start PostgreSQL

```bash
docker compose up -d db
```

Or point `DATABASE_URL` at an existing PostgreSQL instance.

### 3. Configure the backend

```bash
cp backend/.env.example backend/.env
```

The defaults already match the Docker database. Set a real `JWT_SECRET`.

### 4. Apply migrations and seed

```bash
npm run db:migrate     # prisma migrate dev
npm run db:seed        # demo users, customers, products and challans
```

### 5. Configure the frontend

```bash
cp frontend/.env.example frontend/.env
```

### 6. Run both applications

```bash
npm run dev:backend    # http://localhost:4000
npm run dev:frontend   # http://localhost:5173
```

Open <http://localhost:5173> and sign in with one of the
[test credentials](#test-credentials) — the login screen fills them in for you.

### Useful scripts

| Command | Does |
| ------- | ---- |
| `npm run install:all` | Install both applications |
| `npm run dev:backend` / `dev:frontend` | Run in watch mode |
| `npm run build` | Build both for production |
| `npm test` | Backend integration tests |
| `npm run typecheck` | Typecheck both applications |
| `npm run lint` | Lint the frontend |
| `npm run db:migrate` / `db:seed` | Migrate / seed |

---

## Environment variables

Secrets are never committed. `.env` is git-ignored; `.env.example` documents the
shape.

### Backend — `backend/.env`

| Variable | Required | Default | Purpose |
| -------- | :------: | ------- | ------- |
| `DATABASE_URL` | ✔ | — | PostgreSQL connection string used by the application |
| `DIRECT_DATABASE_URL` | ✔ | — | Unpooled connection used by Prisma Migrate. With a managed provider such as Neon this is the endpoint **without** `-pooler`; with a plain PostgreSQL set it to the same value as `DATABASE_URL` |
| `TEST_DATABASE_URL` | | local test DB | Database for the integration suite; reset on every run, and the suite refuses a non-local host |
| `JWT_SECRET` | ✔ | — | Signs access tokens; at least 16 characters |
| `JWT_EXPIRES_IN` | | `8h` | Token lifetime |
| `PORT` | | `4000` | HTTP port |
| `NODE_ENV` | | `development` | `development` · `test` · `production` |
| `CORS_ORIGIN` | | `http://localhost:5173` | Comma separated allowed origins; `*` allows any |
| `SEED_DEFAULT_PASSWORD` | | `Password@123` | Password applied to seeded accounts |

Configuration is validated with Zod at boot, so a misconfigured deployment fails
immediately with a readable message instead of at the first request.

### Frontend — `frontend/.env`

| Variable | Required | Purpose |
| -------- | :------: | ------- |
| `VITE_API_BASE_URL` | ✔ | Backend API base, e.g. `http://localhost:4000/api` |

Only `VITE_*` variables reach the browser, and they are inlined at build time.

---

## Test credentials

All four accounts share the password from `SEED_DEFAULT_PASSWORD`
(`Password@123` by default). The login screen offers them as one-click buttons.

| Role | Email | Password |
| ---- | ----- | -------- |
| Admin | `admin@minierp.com` | `Password@123` |
| Sales | `sales@minierp.com` | `Password@123` |
| Warehouse | `warehouse@minierp.com` | `Password@123` |
| Accounts | `accounts@minierp.com` | `Password@123` |

Signing in as each shows a different navigation and a different set of actions —
Sales cannot edit products, Warehouse cannot raise challans, Accounts can read
everything and change nothing.

---

## Business rules

These are the rules the case study calls out, and how they are enforced.

### Stock can never go negative

Every stock change goes through one function. An `OUT` movement is applied as a
conditional update:

```sql
UPDATE products SET current_stock = current_stock - :qty
WHERE id = :id AND current_stock >= :qty
```

If no row is affected, there was not enough stock and the request is rejected.
Because the check and the decrement are a single atomic statement, two concurrent
dispatches cannot both pass the check and drive stock below zero.

### An insufficient challan changes nothing

Confirming a challan applies every line inside one transaction. If any line is
short, the transaction rolls back: no stock is reduced, no movement is written
and the challan stays a draft. Creating a challan directly as `CONFIRMED` behaves
the same way — nothing is persisted at all.

The error is specific:

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Insufficient stock for Basmati Rice 25kg Bag (GRN-RICE-25). Requested 99999, available 193.",
    "details": { "requested": 99999, "available": 193, "sku": "GRN-RICE-25" }
  }
}
```

### Challans store a product snapshot

Each line copies the product's name, SKU, category, location and unit price at
creation time. Renaming or repricing a product afterwards leaves historical
challans — and their totals — untouched.

### Stock only moves through the ledger

`currentStock` is not accepted by the product update endpoint. The only way to
change stock is a movement, so the sum of movements always reconciles with the
product, and every change has a reason, an author and a timestamp.

### Challan numbers are unique under concurrency

Numbers come from a counter table updated with a single
`INSERT … ON CONFLICT DO UPDATE … RETURNING`, which is atomic in PostgreSQL.

### Transactions survive network latency

Every stock adjustment is one `UPDATE … RETURNING` statement rather than a
read-check-write-read sequence, so a challan line costs two round trips instead
of four, and the post-update balance comes straight from the statement that
produced it. Transactional operations also carry an explicit budget
(`maxWait: 10s, timeout: 30s`); Prisma's 5 second default is comfortable against
a local database but not against a hosted one several hundred milliseconds away.

### Documents become immutable

Only drafts can be edited. Confirming twice, editing a confirmed challan, or
confirming a cancelled one each return a specific business error rather than
silently succeeding.

---

## API

The full reference — every endpoint, field, validation rule, status code and
error code — is in **[docs/API.md](docs/API.md)**.

Quick shape:

```text
POST   /api/auth/login
GET    /api/auth/me

GET    /api/customers                     ?search &status &type &followUpDue &page &pageSize
POST   /api/customers
GET    /api/customers/:id
PATCH  /api/customers/:id
GET    /api/customers/:id/follow-ups
POST   /api/customers/:id/follow-ups

GET    /api/products                      ?search &category &location &lowStock &page
POST   /api/products
GET    /api/products/facets
GET    /api/products/:id
PATCH  /api/products/:id

GET    /api/inventory/summary
GET    /api/inventory/movements           ?productId &type &search &from &to &page
POST   /api/inventory/movements

GET    /api/challans                      ?search &status &customerId &from &to &page
GET    /api/challans/summary
POST   /api/challans
GET    /api/challans/:id
PATCH  /api/challans/:id
POST   /api/challans/:id/confirm
POST   /api/challans/:id/cancel

GET    /api/dashboard                     ?days
GET    /health
```

### Postman

`docs/postman/` holds the collection and a matching environment.

1. Import both files into Postman.
2. Select the environment and set `baseUrl`.
3. Run **Authentication → Login (Admin)** — tokens are captured automatically,
   and later requests reuse the ids they create.

The collection covers logins for all four roles, the CRM, product, inventory and
challan flows, and the failure paths: invalid credentials, missing token,
validation errors, duplicates, forbidden roles and insufficient stock. Every
request carries assertions, so **Run collection** doubles as a smoke test.

---

## Testing

```bash
npm test
```

78 integration tests run against a real PostgreSQL database — `mini_erp_crm_test`
is created and reset automatically, and every test starts from an empty schema so
cases cannot leak into one another.

| File | Covers |
| ---- | ------ |
| `auth.test.ts` | Login for all four roles, wrong password, unknown email, validation, deactivated accounts, malformed and missing tokens, protected routes |
| `customers.test.ts` | Creation and normalisation, GST validation, duplicates, search, filters, pagination, partial updates, follow-ups and follow-up date propagation, role restrictions |
| `inventory.test.ts` | Product validation, SKU uniqueness, opening stock as a movement, low-stock flags, IN/OUT arithmetic, exact-stock dispatch, the negative stock guard, role restrictions |
| `challans.test.ts` | Number generation and sequencing, snapshots surviving a product edit, drafts not touching stock, per-line and whole-transaction stock rules, rollback on a short line, state transitions, cancellation returning stock |

The stock rules have dedicated cases for the boundary (`quantity == stock`
succeeds, `quantity == stock + 1` is rejected) and for the rollback case where
one line of a multi-line challan is short.

The complete flow was also driven through a real browser against the running
application: a draft leaves stock untouched, confirming reduces it by the
dispatched quantity, and a request beyond available stock is rejected with
inventory unchanged.

---

## Docker

```bash
docker compose up -d db                      # database only (development)
docker compose --profile app up -d --build   # database + API + web
```

| Service | URL |
| ------- | --- |
| Web | http://localhost:8080 |
| API | http://localhost:4000 |
| PostgreSQL | localhost:5432 |

The API container applies migrations before it starts serving. Seed it once:

```bash
docker compose exec api npx tsx prisma/seed.ts
```

Both images are multi-stage; the backend runtime carries no build tooling and
runs as an unprivileged user.

---

## Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request to `main`:

- **Backend** — typecheck (runtime sources and the ESM test suite), a
  `prisma migrate deploy` against a clean PostgreSQL service container to prove
  the migrations apply, a build, then the integration tests
- **Frontend** — lint, typecheck and a production build
- **Docker** — both images build, gated behind the two application jobs

---

## Deployment

Step-by-step instructions for Neon, Render and Vercel — including environment
variables, seeding and a post-deployment checklist — are in
**[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

| Piece | Platform |
| ----- | -------- |
| Frontend | Vercel |
| Backend | Render |
| Database | Neon |

**Database — done.** The application runs against a hosted **Neon** PostgreSQL
database. Migrations are applied, the demo data is seeded, and the full business
flow has been verified against it: all four roles authenticate, a draft leaves
stock untouched, confirming reduces it, an over-request is rejected with
`INSUFFICIENT_STOCK` and no change to inventory, cancelling returns the stock,
and role boundaries hold.

**Frontend and backend hosting — not yet.** No Vercel or Render deployment has
been created, so there are no live URLs to quote. Everything needed is committed
(`render.yaml`, `frontend/vercel.json` and the walkthrough above).

---

## Known limitations

Only things that are genuinely incomplete are listed here.

- **Frontend and backend are not hosted yet.** The database is live on Neon, but
  no Vercel or Render deployment exists, so there is no public URL. The
  configuration and instructions are in place.
- **Neon free tier is slow.** Round trips to the hosted database run around a
  second, so list screens take a few seconds to populate and the dashboard —
  which aggregates across every module — takes longer still. This is the free
  tier's shared compute and the network distance, not the queries: the same
  endpoints return in tens of milliseconds against a local PostgreSQL. A paid
  tier in a nearer region, or running the database locally, removes it.
- **User management is seed-only.** There is no admin screen to invite users or
  change roles — accounts come from `prisma/seed.ts`. Login, roles and
  authorization are complete; only the management UI is missing.
- **No password change or reset flow.** Passwords are hashed correctly, but a
  user cannot change their own.
- **Pickers load one page.** The customer and product selectors on the challan
  form request the API's maximum page size of 100 records. With a larger
  catalogue these would need to become search-as-you-type controls.
- **No refresh tokens.** The access token lasts eight hours; when it expires the
  user is signed out and must log in again.
- **Print is the browser's.** The challan detail page prints through the browser
  rather than generating a PDF. Invoice PDF export was listed as a bonus and is
  not implemented.
- **No product images.** S3 upload was listed as a bonus and is not implemented.
- **Dashboard aggregates are computed per request.** Fine at this data volume;
  a larger dataset would want caching or materialised summaries.
- **Single currency and locale.** Amounts are formatted as INR with the `en-IN`
  locale throughout.
