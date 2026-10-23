# API reference

Base URL: `<host>/api` — locally `http://localhost:4000/api`.

## Conventions

Every response uses one of two envelopes.

**Success**

```json
{ "success": true, "data": { }, "meta": { "page": 1, "pageSize": 10, "total": 42, "totalPages": 5 } }
```

`meta` is present only on paginated list endpoints.

**Failure**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted data is invalid",
    "details": [{ "source": "body", "field": "mobile", "message": "Enter a valid 10 digit Indian mobile number" }]
  }
}
```

### Status codes

| Code | Used for |
| ---- | -------- |
| 200 | Successful read or update |
| 201 | Resource created |
| 400 | Malformed request (e.g. invalid JSON) |
| 401 | Missing, invalid or expired token |
| 403 | Authenticated, but the role lacks the capability |
| 404 | Resource or route does not exist |
| 409 | Uniqueness conflict (duplicate mobile number or SKU) |
| 422 | Validation failure or a business rule violation |
| 500 | Unexpected server error (no internals are exposed) |

### Error codes

| Code | Meaning |
| ---- | ------- |
| `VALIDATION_ERROR` | One or more fields failed validation; `details` lists them |
| `UNAUTHORIZED` | Authentication required or rejected |
| `FORBIDDEN` | Role does not hold the required capability |
| `NOT_FOUND` | Resource missing |
| `CONFLICT` | Duplicate mobile number or SKU |
| `INSUFFICIENT_STOCK` | Requested quantity exceeds stock; `details` carries `requested` and `available` |
| `PRODUCT_INACTIVE` | A discontinued product cannot be sold |
| `CHALLAN_NOT_EDITABLE` | Only drafts can be edited |
| `CHALLAN_ALREADY_CONFIRMED` | The challan is already confirmed |
| `CHALLAN_ALREADY_CANCELLED` | The challan is already cancelled |
| `CHALLAN_CANCELLED` | A cancelled challan cannot be confirmed |
| `CHALLAN_EMPTY` | A challan with no lines cannot be confirmed |

### Authentication

All routes except `POST /auth/login` and `GET /health` require:

```
Authorization: Bearer <token>
```

### Pagination, search and sorting

List endpoints accept `page` (default `1`) and `pageSize` (default `10`, maximum `100`).
Each list documents its own `search`, filter and `sortBy` / `sortOrder` options below.

---

## Capability matrix

Routes declare the capability they need; the table maps capabilities to roles.

| Capability | Admin | Sales | Warehouse | Accounts |
| ---------- | :---: | :---: | :-------: | :------: |
| `customer:read` | ✔ | ✔ | ✔ | ✔ |
| `customer:write` | ✔ | ✔ | | |
| `followup:write` | ✔ | ✔ | | |
| `product:read` | ✔ | ✔ | ✔ | ✔ |
| `product:write` | ✔ | | ✔ | |
| `inventory:read` | ✔ | ✔ | ✔ | ✔ |
| `inventory:write` | ✔ | | ✔ | |
| `challan:read` | ✔ | ✔ | ✔ | ✔ |
| `challan:write` | ✔ | ✔ | | |
| `challan:confirm` | ✔ | ✔ | ✔ | |
| `challan:cancel` | ✔ | ✔ | | |

The authenticated user's resolved capabilities are returned with their profile so
the frontend can render role-appropriate navigation. The server table remains the
authoritative check.

---

## Health

### `GET /health`

Unauthenticated liveness probe used by Render and the container healthchecks.

```json
{ "success": true, "data": { "status": "ok", "environment": "production" } }
```

---

## Authentication

### `POST /auth/login`

| Field | Type | Rules |
| ----- | ---- | ----- |
| `email` | string | required, valid email, lowercased |
| `password` | string | required |

**201/200 response**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi…",
    "user": {
      "id": "cms…",
      "name": "Aarti Menon",
      "email": "admin@minierp.com",
      "role": "ADMIN",
      "permissions": ["customer:read", "customer:write", "…"]
    }
  }
}
```

Unknown emails and wrong passwords both return `401 Invalid email or password`, so
the API never reveals which accounts exist. A deactivated account returns `403`.

### `GET /auth/me`

Returns the authenticated profile with its capabilities. The user is re-read from
the database on every request, so a deactivated account loses access immediately
rather than when its token happens to expire.

---

## Customers — `customer:read` / `customer:write`

### `GET /customers`

| Query | Values |
| ----- | ------ |
| `search` | free text across name, business name, mobile, email and GST |
| `status` | `LEAD` · `ACTIVE` · `INACTIVE` |
| `type` | `RETAIL` · `WHOLESALE` · `DISTRIBUTOR` |
| `followUpDue` | `true` — only customers whose follow-up date has arrived or passed |
| `sortBy` | `createdAt` (default) · `name` · `followUpDate` · `status` |
| `sortOrder` | `asc` · `desc` (default) |
| `page`, `pageSize` | pagination |

Each row carries `_count.followUps` and `_count.challans`.

### `POST /customers` — `customer:write`

| Field | Type | Rules |
| ----- | ---- | ----- |
| `name` | string | required, ≤ 120 |
| `businessName` | string | required, ≤ 150 |
| `mobile` | string | required; normalised (spaces, dashes and `+91` stripped) then validated as a 10 digit number starting 6–9; unique |
| `email` | string | required, valid email, lowercased |
| `gstNumber` | string \| null | optional; when present must be a valid 15 character GSTIN |
| `type` | enum | required |
| `status` | enum | defaults to `LEAD` |
| `address` | string | required, ≤ 500 |
| `followUpDate` | date \| null | optional; ISO datetime or `YYYY-MM-DD` |
| `notes` | string \| null | optional, ≤ 2000 |

Returns `201`, or `409` when the mobile number already belongs to another customer.

### `GET /customers/:id`

Full record plus the twenty most recent follow-ups and the ten most recent challans.

### `PATCH /customers/:id` — `customer:write`

Partial update; at least one field is required. Same validation as create.

### `GET /customers/:id/follow-ups`

Paginated follow-up history, newest first.

### `POST /customers/:id/follow-ups` — `followup:write`

| Field | Type | Rules |
| ----- | ---- | ----- |
| `note` | string | required, ≤ 2000 |
| `followUpDate` | date \| null | optional |

When `followUpDate` is supplied the customer's own follow-up date is moved forward
in the same transaction, so the CRM list always reflects the latest agreed date.

---

## Products — `product:read` / `product:write`

### `GET /products`

| Query | Values |
| ----- | ------ |
| `search` | free text across name, SKU and category |
| `category`, `location` | exact match, case insensitive |
| `lowStock` | `true` — only products at or below their alert quantity |
| `isActive` | `true` · `false` |
| `sortBy` | `createdAt` (default) · `name` · `sku` · `currentStock` · `unitPrice` |
| `sortOrder` | `asc` · `desc` (default) |

Each row is enriched with `stockValue`, `isLowStock` and `isOutOfStock`.

### `GET /products/facets`

Distinct categories and locations, used to populate filters and form suggestions.

### `POST /products` — `product:write`

| Field | Type | Rules |
| ----- | ---- | ----- |
| `name` | string | required, ≤ 150 |
| `sku` | string | required, 2–40, `[A-Za-z0-9-_/]`, stored upper case, unique |
| `category` | string | required, ≤ 80 |
| `unitPrice` | number | required, ≥ 0, at most 2 decimal places |
| `currentStock` | integer | optional opening stock, ≥ 0, default `0` |
| `minStockAlert` | integer | optional, ≥ 0, default `0` |
| `location` | string | required, ≤ 120 |

Opening stock is written as an `IN` movement so the ledger reconciles from the
first entry. Returns `409` on a duplicate SKU.

### `GET /products/:id`

Product detail with its twenty most recent stock movements.

### `PATCH /products/:id` — `product:write`

Accepts `name`, `sku`, `category`, `unitPrice`, `minStockAlert`, `location` and
`isActive`. **`currentStock` is deliberately not accepted** — stock only changes
through a recorded movement, which keeps the inventory history a truthful audit
trail.

---

## Inventory — `inventory:read` / `inventory:write`

### `GET /inventory/summary`

```json
{
  "totalProducts": 8,
  "totalUnits": 787,
  "stockValue": 1048035,
  "lowStockCount": 2,
  "outOfStockCount": 1,
  "today": { "quantityIn": 993, "quantityOut": 0 }
}
```

### `GET /inventory/movements`

| Query | Values |
| ----- | ------ |
| `productId` | restrict to one product |
| `type` | `IN` · `OUT` |
| `search` | free text across the reason, product name and SKU |
| `from`, `to` | ISO datetime or `YYYY-MM-DD` |

Newest first. Movements generated by a challan carry that challan on `challan`.

### `POST /inventory/movements` — `inventory:write`

| Field | Type | Rules |
| ----- | ---- | ----- |
| `productId` | string | required |
| `type` | enum | `IN` or `OUT` |
| `quantity` | integer | required, > 0 |
| `reason` | string | required, ≤ 200 |

An `OUT` movement uses a conditional update (`currentStock >= quantity`) so the
availability check and the decrement happen in one atomic statement — concurrent
dispatches can never drive stock below zero. Returns `422 INSUFFICIENT_STOCK`
with `details.requested` and `details.available` when there is not enough stock.

---

## Sales challans — `challan:read` / `challan:write` / `challan:confirm` / `challan:cancel`

### `GET /challans`

| Query | Values |
| ----- | ------ |
| `search` | free text across challan number, customer name and business name |
| `status` | `DRAFT` · `CONFIRMED` · `CANCELLED` |
| `customerId` | restrict to one customer |
| `from`, `to` | creation date range |
| `sortBy` | `createdAt` (default) · `challanNumber` · `totalAmount` |

### `GET /challans/summary`

Counts, value and quantity grouped by status.

### `POST /challans` — `challan:write`

| Field | Type | Rules |
| ----- | ---- | ----- |
| `customerId` | string | required, must exist |
| `items` | array | 1–100 lines; each `{ productId, quantity }`; a product may appear only once |
| `items[].quantity` | integer | required, > 0 |
| `notes` | string \| null | optional, ≤ 1000 |
| `status` | enum | `DRAFT` (default) or `CONFIRMED` |

The challan number is generated as `CH-YYYYMM-NNNN` from an atomic PostgreSQL
counter, so concurrent requests never receive the same number.

Each line stores a **product snapshot** — `productName`, `productSku`,
`productCategory`, `productLocation` and `unitPrice` — so the document stays
accurate even if the catalogue changes later.

With `status: "CONFIRMED"` the stock reduction runs in the same transaction: if
any line is short, nothing is persisted and no stock moves.

### `GET /challans/:id`

Full challan with its snapshotted lines and the stock movements it generated.

### `PATCH /challans/:id` — `challan:write`

Edits a **draft only**; confirmed and cancelled challans return
`422 CHALLAN_NOT_EDITABLE`. Supplying `items` replaces the lines and recomputes
the totals.

### `POST /challans/:id/confirm` — `challan:confirm`

Confirms the challan and releases stock. Every line is checked and applied inside
one transaction, so an insufficient line rejects the whole operation with
`422 INSUFFICIENT_STOCK` and leaves inventory untouched — no partial reduction.

### `POST /challans/:id/cancel` — `challan:cancel`

| Field | Type | Rules |
| ----- | ---- | ----- |
| `reason` | string \| null | optional, ≤ 200 |

Cancelling a **confirmed** challan returns the dispatched quantities to stock as
`IN` movements, keeping the ledger balanced. Cancelling a draft simply marks it
cancelled.

---

## Dashboard

### `GET /dashboard?days=90`

`days` accepts 7–365 and defaults to 90. Returns one payload covering revenue
against the preceding window, CRM pipeline counts, challan counts by status,
inventory health, top customers with their revenue share, best selling products,
a gap-free six month revenue series, per-user challan performance, low stock
alerts, recent challans and due follow-ups.
