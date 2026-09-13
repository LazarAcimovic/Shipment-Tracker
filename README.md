# Shipment Tracker

A logistics operations dashboard that answers two questions every morning: **where does every shipment stand, and what is running late today?**

---

## Live app (hosted on Render)

Everything - frontend, backend, and PostgreSQL database - is deployed on Render (free plan):

**https://shipment-tracker-mgu3.onrender.com/**

> ⚠️ **Please read before you click - the free plan sleeps.**
> Render's free services spin down after 15 minutes of inactivity. The **first request after the app has been idle takes up to a minute** while the backend wakes back up, and the database wakes with it. This is a Render free-tier limitation, not an app bug.
>
> **So, open the link and start clicking around immediately.** Do not open it, leave it sitting for 15–30 minutes, and then come back expecting it to be instant, because, at that point, the service has gone back to sleep and the next request will again pay the 1 minute wake-up cost. If a request seems to hang on first load, give it that minute. Every request afterwards is fast.

If the hosted app is unavailable for any reason, the app runs locally in a few minutes - see below.

---

## Running it locally

### Prerequisites

- **Node.js v24.11.0** (the version this was built and tested on - pin it; other versions are untested)
- **PostgreSQL 15** (local install)

### 1. Database

Create an empty database in your local PostgreSQL 15, e.g.:

```bash
createdb shipment_tracker
```

### 2. Backend (`api/`)

```bash
cd api
cp .env.example .env
```

Edit `api/.env` and point `DATABASE_URL` at your local database (default in `.env.example` assumes user `postgres` / password `postgres` on `localhost:5432`):

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/shipment_tracker"
PORT=3000
WEB_ORIGIN="http://localhost:4200"
```

Then install, apply the migration, seed, and run:

```bash
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

`prisma migrate deploy` applies the existing migration files committed in `prisma/migrations/` - it creates the tables from the committed schema and never generates a new one. Use this when the migration already exists in the repo (the normal case when cloning).

> If for any reason you need to start completely from scratch (no migration files, empty database), use `npx prisma migrate dev --name init` instead - this generates a new migration from `schema.prisma` and applies it. For a normal clone-and-run this is not needed.

`prisma db seed` runs `prisma/seed.ts`, which **truncates all tables first** and then loads ~5 customers and ~15–20 shipments spread across every status, including several that are late, few that are delivered, out for delivery and so on.

**Confirm the API is up before starting the frontend** - open `http://localhost:3000/api/health` in your browser. You should see `{ "status": "ok" }`. If you see an error here, fix it before proceeding.

### 3. Frontend (`frontend/`)

```bash
cd frontend
npm install
npm start
```

Open `http://localhost:4200`. The local `environment.ts` already points at `http://localhost:3000/api`, so no frontend configuration is needed.

### Startup order

Database → migration → seed → backend → frontend. Do not skip the health check between backend and frontend.

---

## Exact versions installed

| Package                 | Version |
| ----------------------- | ------- |
| Node.js                 | 24.11.0 |
| PostgreSQL              | 15      |
| **Backend**             |         |
| Express                 | 4.22.2  |
| Prisma / @prisma/client | 5.22.0  |
| Zod                     | 3.25.76 |
| TypeScript              | 5.9.3   |
| Vitest                  | 5.0.0   |
| **Frontend**            |         |
| Angular                 | 17.3.12 |
| Angular Material        | 17.3.10 |
| Zod                     | 4.6.2   |
| TypeScript              | 5.4.5   |

---

## How it's built (conventions & practices)

- **Separation of concerns on the backend.** A strict one-way flow: **controller → service → repository → database (Prisma ORM)**. The controller only handles HTTP and validation, the service holds the business rules (state machine, lateness, transactions), and the repository is the only layer that touches Prisma.
- **Feature-Sliced Design (FSD)** on the frontend - each feature owns its slice (`features/shipment-list`, `features/shipment-detail`, …); anything shared lives under `shared/` (models, services, utils, constants).
- **BEM** methodology for the small amount of custom CSS (`block__element--modifier`). Most of the styling, as well as the responsive part comes from Angular Material.
- **SQL-injection protection** - all database access goes through Prisma's parameterized queries, no string-built SQL anywhere.
- **Indexes** on the columns the queries filter, search, and sort on (`currentStatus + promisedDeliveryDate`, `customerId`, and `shipmentId + occurredAt` on the event log) - these ensure the list, filter, and search operations hit an index rather than doing a full table scan, keeping queries fast even as the dataset grows.
- **Validation on both sides with Zod** - the frontend validates for instant UX feedback, the backend validates as well (because he is the single source of truth) and rejects bad input with `422` before it reaches the service.
- **Unit tests** (Vitest) covering the pure domain logic - the state machine transitions and the lateness computation.
- **Debounced API calls** on the search input - the request fires only after the user stops typing for 400 ms, avoiding unnecessary network calls on every keystroke.
- **Clean code**: simple TypeScript (no `any`), no code comments (names carry the meaning), DRY, and semantic HTML for screen readers.

### Responsive layout

Responsiveness is handled **automatically by Angular Material** - its table, form fields, toolbar, and layout components adapt to narrower screens on their own, so there was practically no need for custom media queries. The data table scrolls horizontally rather than overflowing the viewport on small screens.

---

## Challenges I hit (and how I solved them)

### 1. Late shipments not appearing on page one (the pagination + sort bug)

This one had two layers.

**The first problem.** When the page size was lowered from 20 to 10, late shipments only showed up on the _second_ page. The reason: the backend loaded, say, the first 10 shipments (none of which happened to be late), returned them to the frontend, and the **frontend** then tried to sort "late first". But since none of those 10 were late, there was nothing to bring to the top. The late ones were sitting on page 2, never fetched. Sorting _after_ pagination can only reorder the slice it was given, but, it cannot pull in rows that the database's `LIMIT` already excluded.

**The fix for the first problem.** We moved the ordering into the database. Regardless of whether the "only late" filter is on or off, the repository now **always sorts by `promisedDeliveryDate ASC`**. Because past dates come before future dates, this naturally floats the most-overdue shipments to the top _before_ the `LIMIT` clause runs, and because of that, they land on page one.

**The second problem.** Sorting by `promisedDeliveryDate` is applied before `LIMIT`, but "earliest promised date" does **not** mean "late". So the backend returned the earliest-promised shipments first, but within a page the late ones still weren't cleanly grouped at the top, e.g. the first two rows were late, the third was on-time, and the fourth was late again, instead of all the late ones sitting together. Whether a shipment is late is a **computed** field (it depends on the current time), so the database can't order by it directly, and two shipments can share the same `promisedDeliveryDate` while one is delivered-on-time and the other is not.

**The fix for the second problem.** Basically, we kept the backend `promisedDeliveryDate ASC` sort for correct cross-page ordering, and added a **secondary sort on the frontend, inside the load function**, as a tie-breaker within each page: late-before-not-late, then most-overdue first (`lateByMs` descending). Backend ordering decides _which_ shipments appear on the page whereas the frontend tie-break makes the late ones sit cleanly at the top of it.

### 2. "Late only" filter showing the wrong total in the paginator

Toggling "late only" displayed only 3 rows but the paginator read "1–7 of 7". The two bugs were responsible for it:

**The first problem - the repository's `lateOnly` WHERE clause was wrong for delivered shipments.** The condition for delivered-late was:

```sql
WHERE (
  ("currentStatus" != 'DELIVERED' AND "promisedDeliveryDate" < NOW())
  OR
  ("currentStatus" = 'DELIVERED' AND "deliveredAt" IS NOT NULL)
)
```

The second branch just checks `deliveredAt IS NOT NULL`, which is true for **every** delivered shipment - on-time or not. It was supposed to match only those where `deliveredAt > promisedDeliveryDate`. So the database count included all delivered shipments, inflating `total` to 7.

**The second problem - the service filtered in memory but returned the wrong total.** As a safety net the service applied `mapped.filter((s) => s.isLate)` after the DB call, which correctly trimmed the result to 3 truly late shipments. But `total` was taken from the database count (7), not from the filtered result - so the paginator thought there were 7 items while only 3 were on screen.

**The fix.** Prisma's type-safe query builder cannot compare two columns directly (`deliveredAt > promisedDeliveryDate`), so the repository now fires a small `$queryRaw` to collect the IDs of genuinely late shipments:

```sql
SELECT id FROM "Shipment"
WHERE (
  ("currentStatus" != 'DELIVERED' AND "promisedDeliveryDate" < NOW())
  OR
  ("currentStatus" = 'DELIVERED' AND "deliveredAt" > "promisedDeliveryDate")
)
```

Those IDs are fed into `where.id = { in: [...] }` on the standard Prisma query, so `findMany` and `count` both operate on the correct set - `total` is now accurate and the in-memory filter in the service remains as a safety net.

### 3. Slow initial load on the hosted app (Render cold start)

The first request after opening the hosted app can take 20–30 seconds to respond. This is **not a performance issue with the implementation**. Locally the app loads almost immediately. It is Render's free-plan **cold start**: when a free Web Service has been idle for 15 minutes, Render shuts down its container to save resources. The next incoming request has to wait while Render:

1. Allocates a new container
2. Starts the Node process
3. Establishes Prisma's connection pool to the database

That sequence takes 20–60 seconds. Every request after the service is warm is fast. The database indexes (on `currentStatus`, `promisedDeliveryDate`, `customerId`, etc.) ensure the queries themselves are efficient. So, the bottleneck on first load is purely service startup, not query time.

The workaround is simply to open the app and start using it immediately rather than leaving it idle and coming back later.

### 4. Transaction timeout when seeding the Render database over the public internet

Seeding the hosted database from a local machine (because of free plan's restrictions) means talking to Render's Postgres over the **public internet** (the External Database URL) instead of Render's fast internal network. The seed runs inside a single Prisma `$transaction`, and Prisma's default transaction timeout is 5 seconds - long enough locally, but the round-trips over the public connection blew past it, and the seed died with _"Transaction already closed … timeout for this transaction was 5000 ms."_

**The fix.** Raise the transaction timeout for the seed: `prisma.$transaction(fn, { timeout: 60000 })`. This is only needed because we're seeding a remote DB over the internet from a laptop - locally, or from inside Render's own network, the default would be fine.

---

## Decisions

### The ambiguous points from §04 (by label)

**Q1 - What does "late" mean, and is it stored or computed?**
Computed, never stored. Lateness is measured against `promisedDeliveryDate`. An in-transit shipment is late when `now > promisedDeliveryDate` and it isn't delivered. A delivered shipment is late when `deliveredAt > promisedDeliveryDate`. "How late" (for worst-first sorting) is `(deliveredAt ?? now) - promisedDeliveryDate`. We deliberately do **not** store an `isLate` boolean. Lateness depends on the current time, which changes constantly without any database write. Imagine storing `isLate = false` today because the promised date is tomorrow. Midnight passes, the shipment is now late, but the database still says `false` because nothing wrote to it. Two approaches could keep it accurate, but both of those are worse than computing it:

- **Update on every read** - before returning the list, run `UPDATE Shipment SET isLate = true WHERE promisedDeliveryDate < NOW()`. This works, but now every `GET /api/shipments` call does a write as a side effect. A GET request mutating data is not standardised way of doing so.
- **Background job** - a cron that periodically scans and flips the flag, which requires extra infrastructure to maintain.

Computing it on read avoids both: `now > promisedDeliveryDate` is evaluated in the mapper at the moment the API response is built, so it can never go stale. Only `deliveredAt` is stored (it's a fact set once when the `DELIVERED` event is recorded); `isLate` and `lateByMs` are attached to each shipment by the server as computed response fields.

**Q2 - Can status move from any state to any other? Where does the rule live?**
No. A shipment moves step by step through `CONFIRMED → PREPARED → PICKED_UP → DEPARTED → AT_HUB → OUT_FOR_DELIVERY → DELIVERED`. The only loop is `AT_HUB → DEPARTED` (a shipment can pass through several hubs), wherease `DELIVERED` is terminal. This rule lives in **one place on the server** (`domain/stateMachine.ts`) and is **enforced by the backend**. The frontend only offers the allowed next statuses for UX.

**Q3 - What is an "event", and how does it relate to status?**
The `ShipmentEvent` log is the **source of truth** (the full append-only history). The shipment's `currentStatus` is a **denormalized cache** of the latest event's status, kept as a column so listing shipments is a single fast query instead of an N+1 join into the event log. An event records the status the shipment transitioned _into_, so both use the same enum and `currentStatus` always equals the newest event's status.

**Q4 - What happens on a contradicting event?**
The server rejects it with **HTTP 422** and a clear message, and writes nothing. The transition is validated against the state machine _before_ the transaction opens, so an illegal event (e.g. `DEPARTED` on a `DELIVERED` shipment) never touches the database.

**Q5 - How much data before it breaks, and where first?**
See "Where it would break first at scale" below.

### Assumptions made where the brief was silent

- **No separate Order entity.** The brief describes a path from "customer order" to delivery. We folded the order concept directly into `Shipment`. A shipment is created when an order is confirmed, and `CONFIRMED` is its first status.
- **`origin` is required.** A shipment with no origin has no useful timeline. Required at creation.

### Deliberately left out, and why

- **Order entity** - folds cleanly into Shipment for this scope. Creating an order entity would add a layer with no user-visible benefit.
- **Customer CRUD** - the brief explicitly pre-loads customers. Building a create/edit/delete screen would consume time better spent on the operations dashboard.
- **Authentication and authorization** - explicitly out of scope per the brief.
- **Email / notifications** - out of scope. The operations person uses the dashboard directly.
- **NgRx (global state)** - screens navigate between each other and the server is the source of truth. Each screen refetches on entry. A global store pays off only when multiple components share the same mutable state, which does not exist here. Plain injectable services with signals are sufficient.
- **Editing or deleting past events** - the event log is append-only by design. History is immutable, and according to that, correcting a mistake means recording a new event.

### Where it would break first at scale

- **Too much shipments** Imagine we had like 100 000, or more shipments. If we did not use pagination, the load would be extremely laggy, or impossible in the worst case. That's why the pagination was used which loads only the certain amount of shipments per page, facilitating frontend's display performances. Besides that, indexes were used for faster reading performances.
- **The event log.** It is append-only and never truncated. At high volume (many events per shipment, millions of shipments) the `ShipmentEvent` table grows without bound. Fix would be to use for example S3 bucket to store the events that happened in last e.g. 90 days there and to store the most recent events, for example 40 events. In that way, we provided faster reading performances.
- **Render free plan.** The hosted app sleeps after inactivity and the free database is capped and time-limited - fine for a demo, not for real load.

### What I would do differently with two more days

- **Split Order from Shipment.** An order can have multiple shipments. The current model cannot represent that.
- **Richer event types.** Right now an event carries a status, a location, and an optional text note. A proper event type enum (e.g. `DAMAGE`, `ADDRESS_CHANGE`) would make filtering and reporting more useful.
- **More test coverage.** The domain logic (state machine, lateness) has unit tests; with more time we'd add an integration test per endpoint.
