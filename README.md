# CEX

A work-in-progress centralized exchange built with TypeScript, Bun, Express,
Redis, PostgreSQL, Prisma, Zod, and Decimal.js.

The project is being developed as a set of separate services. The backend owns
HTTP and authentication, while the matching engine owns balances, orders,
fills, matching decisions, and live order books. Redis Lists carry correlated
commands and responses between those services.

> **Status:** Active development. This repository is not production-ready and
> must not be used with real funds.

## Architecture

[`ARCHITECTURE.md`](./ARCHITECTURE.md) is the authoritative design document for
this repository. It defines service ownership, Redis communication, persistence,
market hours, live depth delivery, reliability boundaries, and implementation
order.

The intended request flow is:

```text
Client
  -> Backend HTTP API
  -> Redis command queue
  -> Matching engine
  -> Per-backend Redis response queue
  -> Backend HTTP response
```

## Current progress

### Backend

- Express HTTP server and health endpoint
- User signup and signin backed by PostgreSQL and Prisma
- Password hashing with bcrypt
- JWT creation and authentication middleware
- Zod validation for authentication and order requests
- Protected create-order route
- Redis publisher and dedicated blocking response-listener clients
- Correlation IDs, pending response promises, and engine-response timeouts

### Matching engine

- Initial Redis client setup
- In-memory balances, orders, fills, and order-book state
- Limit-order record creation
- Limit-order balance locking
- Initial price-time matching helpers
- Resting-order insertion
- Depth-delta construction and update sequencing

### Incomplete work

- The engine command-consumer loop and correlated response flow are incomplete
- Create order is not yet functional end to end
- Market-order processing is incomplete
- Some matching and settlement helpers are still under development
- Command and response runtime validation is incomplete
- Snapshot creation and restart restoration are not implemented
- Market-close database synchronization is not implemented
- Market-hours enforcement is not implemented
- Redis Stream depth publishing and the WebSocket service are not implemented
- Automated tests are not yet present

## Repository structure

```text
.
|-- ARCHITECTURE.md       Authoritative target architecture
|-- backend/              HTTP API, authentication, Prisma, Redis client
`-- engine/               Matching engine and live in-memory trading state
```

## Technology

- [Bun](https://bun.sh/) runtime and package manager
- TypeScript
- Express 5
- Redis
- PostgreSQL
- Prisma 7
- Zod
- Decimal.js
- JSON Web Tokens
- bcrypt

## Prerequisites

- Bun 1.4 or newer
- PostgreSQL
- Redis with TLS if required by the provider

## Environment configuration

Create `backend/.env`:

```env
PORT=9000
DATABASE_URL=
JWT_SECRET=
redisUrl=
INCOMING_QUEUE=backend-to-engine-broker
BACKEND_QUEUE_ID=backend-1
ENGINE_TIMEOUT_MS=30000
```

Create `engine/.env`:

```env
REDIS_URL=
INCOMING_QUEUE=backend-to-engine-broker
```

The backend currently reads `redisUrl`, while the engine reads `REDIS_URL`.
This naming difference is temporary and should be standardized in a future
cleanup.

Never commit `.env` files, credentials, JWT secrets, database URLs, or Redis
connection strings.

## Install dependencies

Backend:

```bash
cd backend
bun install
```

Engine:

```bash
cd engine
bun install
```

## Database setup

From `backend/`, configure `DATABASE_URL`, then run the existing Prisma
migrations:

```bash
bunx prisma migrate deploy --config prisma7.config.ts
bunx prisma generate --config prisma7.config.ts
```

## Run locally

Start the engine in one terminal:

```bash
cd engine
bun index.ts
```

Start the backend in another terminal:

```bash
cd backend
bun src/index.ts
```

The backend uses port `9000` by default.

## Current HTTP endpoints

### Health check

```http
GET /health
```

### Sign up

```http
POST /signup
Content-Type: application/json

{
  "username": "example-user",
  "password": "example-password"
}
```

### Sign in

```http
POST /signin
Content-Type: application/json

{
  "username": "example-user",
  "password": "example-password"
}
```

### Create an order

Requires a JWT returned by signup or signin:

```http
POST /order
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "limit",
  "side": "buy",
  "symbol": "BTC",
  "price": 50000,
  "qty": 1
}
```

The create-order route is still under development because the matching engine's
command-processing and response path are not complete.

## Important engineering rules

- The backend owns HTTP and authentication concerns.
- The engine owns balances, orders, fills, matching, and live order books.
- Client-provided user IDs are never trusted; authenticated identity comes from
  the verified JWT.
- Blocking Redis reads use dedicated connections.
- Commands and responses require correlation IDs, timeouts, and cleanup.
- Financial calculations must not rely on JavaScript floating-point arithmetic.
- Backend and engine database ownership must remain separate.

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) before making architectural changes.

## Reliability notice

The MVP architecture uses Redis Lists with `LPUSH` and `BRPOP`. A command can be
lost if the engine crashes after removing it from the queue and before finishing
processing. The repository is not production-ready until retry, idempotency,
recovery, persistence, and failure-handling behavior are fully implemented and
tested.

## Security

Do not commit credentials or connection URLs. If a secret is ever placed in
source code or Git history, rotate it immediately; removing it from the latest
file does not invalidate or erase the exposed credential.
