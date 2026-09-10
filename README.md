# Shipment Tracker

A logistics operations dashboard that answers two questions every morning: where does every shipment stand, and what is running late today?

---

## Prerequisites

- **Node.js v24.11.0** (pin this version; other versions are untested)
- **PostgreSQL 15** — via Docker (recommended) or a local install

---

## Run steps

### 1. Database

**With Docker (recommended):**

```bash
docker compose up -d
```

**With a local PostgreSQL 15:**

Create a database manually, then set `DATABASE_URL` in `api/.env` accordingly.

---

### 2. Backend

```bash
cd api
cp .env.example .env
# Edit .env and set DATABASE_URL if not using Docker defaults
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Confirm the API is up before starting the frontend — open `http://localhost:3000/api/health` in your browser. You should see `{ "status": "ok" }`. If you see an error here, fix it before proceeding; a frontend failure at this point is almost always a backend or database problem.

---

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Open `http://localhost:4200` in your browser.

---

## Startup order

Database → migrations → seed → backend → frontend. Do not skip the health check between backend and frontend.

---

## Exact versions installed

_To be filled in when packages are installed._

---

## Decisions

### Assumptions made where the brief was silent

- **No separate Order entity.** The brief describes a path from "customer order" to delivery. I folded the order concept directly into `Shipment` — a shipment is created when an order is confirmed, and `CONFIRMED` is its first status. This avoids a join that adds no information the operations person cares about.
- **`PREPARED` merges two brief steps.** The brief mentions "goods prepared" and "picked from the warehouse" separately. I merged them into one `PREPARED` status because they always happen together in this workflow and splitting them would add a status with no operational meaning.
- **Single operator, no auth.** The brief says one user opens the app in the morning. No login, no sessions, no roles.
- **`origin` is required.** The brief doesn't say this explicitly, but a shipment with no origin has no useful timeline. Required at creation.
- **`promisedDeliveryDate` is a date without time.** The brief says "promised delivery date" — operations people think in days, not hours. Stored as a full `DateTime` (PostgreSQL `timestamptz`) at midnight UTC so comparisons work correctly, displayed as date-only in the UI.

### Deliberately left out, and why

- **Order entity** — folds cleanly into Shipment for this scope; would add a layer with no user-visible benefit.
- **Customer CRUD** — the brief explicitly pre-loads customers. Building a create/edit/delete screen would consume time better spent on the operations dashboard.
- **Authentication and authorization** — explicitly out of scope per the brief.
- **Email / notifications** — out of scope; the operations person uses the dashboard directly.
- **NgRx (global state)** — screens navigate between each other and the server is the source of truth. Each screen refetches on entry. A global store pays off only when multiple live, distant components share the same mutable state — that does not exist here. Plain injectable services with signals are sufficient.
- **Editing or deleting past events** — the event log is append-only by design. History is immutable; correcting a mistake means recording a new event.
- **Real-time updates** — out of scope; a page refresh or re-navigation picks up the latest state.

### Where it would break first at scale

- **The "late" query with no cursor pagination.** `GET /api/shipments?late=true` currently sorts all late shipments worst-first in the database and returns a page. With hundreds of thousands of shipments this is a full index scan on `promisedDeliveryDate`. Fix: a partial index on `(promisedDeliveryDate, currentStatus)` filtered to `currentStatus != 'DELIVERED'`, plus cursor-based pagination.
- **The event log.** It is append-only and never pruned. At high volume (many events per shipment, millions of shipments) the `ShipmentEvent` table grows without bound. Fix: archive old events to cold storage; the detail view loads only the last N events with a "load more" option.
- **No connection pooling middleware.** A single Node process with one PrismaClient works fine at low concurrency. Under heavy load, add PgBouncer in front of PostgreSQL.

### What I would do differently with two more days

- **Split Order from Shipment.** An order can have multiple shipments (partial deliveries); the current model cannot represent that. The data model change is straightforward; the API and UI changes cascade from it.
- **Richer event types.** Right now an event carries a status, a location, and a free-text note. A proper event type enum (e.g. `DELAY`, `DAMAGE`, `ADDRESS_CHANGE`) would make filtering and reporting more useful.
- **Optimistic UI on the detail screen.** Recording an event currently waits for the round-trip before updating the timeline. With optimistic updates the UI feels instant and rolls back on error.
- **Tests.** Service-layer unit tests (state machine, lateness logic) and at least one integration test per endpoint. The domain logic is pure enough that unit tests are cheap to write.
