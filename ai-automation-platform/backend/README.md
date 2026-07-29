# Backend — AI Automation Platform

Express.js API server with TypeScript, Prisma, PostgreSQL, Redis, BullMQ, JWT auth, and Socket.io.

## Stack

| Technology | Purpose |
|-----------|---------|
| Express.js 5 | HTTP REST API |
| TypeScript | Strict type safety |
| Prisma | PostgreSQL ORM |
| Redis + BullMQ | Caching & background jobs |
| JWT | Access + refresh token auth |
| Socket.io | Realtime events |
| Winston | Structured logging |
| Zod | Environment & request validation |

## Folder Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database models
│   ├── seed.ts                # Seed script
│   └── migrations/            # Migration history
├── src/
│   ├── config/                # Environment & app configuration
│   ├── constants/             # Roles, queue names, HTTP status codes
│   ├── lib/                   # Prisma, Redis, Logger singletons
│   ├── types/                 # Shared TypeScript types
│   ├── interfaces/            # Architectural contracts
│   ├── controllers/           # HTTP handlers (Step 4+)
│   ├── services/              # Business logic (Step 4+)
│   ├── repositories/          # Data access (Step 4+)
│   ├── middlewares/           # Auth, RBAC, validation (Step 4+)
│   ├── routes/                # Route definitions (Step 4+)
│   ├── validators/            # Zod schemas (Step 4+)
│   ├── dtos/                  # Data transfer objects (Step 4+)
│   ├── socket/                # Socket.io handlers (Step 6+)
│   ├── jobs/                  # BullMQ workers (Step 6+)
│   └── agents/                # AI agents (Step 7+)
├── tests/
├── .env.example
├── docker-compose.yml         # (at monorepo root)
└── package.json
```

## Configuration Files

| File | Description |
|------|-------------|
| `src/config/env.ts` | Zod-validated environment variables |
| `src/config/app.config.ts` | Server, CORS, rate limiting |
| `src/config/database.config.ts` | PostgreSQL connection |
| `src/config/redis.config.ts` | Redis & BullMQ connection |
| `src/config/jwt.config.ts` | JWT secrets & token settings |
| `src/config/queue.config.ts` | BullMQ queue defaults |
| `src/config/socket.config.ts` | Socket.io namespaces |
| `src/config/ai.config.ts` | OpenAI, ElevenLabs, Deepgram, Twilio |
| `prisma/schema.prisma` | Full database schema |
| `docker-compose.yml` | PostgreSQL + Redis for local dev |
| `docker/backend/Dockerfile` | Production multi-stage build |

## Quick Start

```bash
# 1. Install dependencies
cd backend && npm install

# 2. Copy environment file
cp .env.example .env
# Edit .env — set JWT secrets (min 32 chars each)

# 3. Start infrastructure
cd .. && docker compose up -d

# 4. Run database migrations
cd backend && npm run db:migrate

# 5. Start dev server (after app.ts is implemented)
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to dist/ |
| `npm run worker` | Start BullMQ worker process |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest tests |

## API Routes (planned)

```
/api/auth        — Authentication
/api/users       — User management
/api/services    — Service catalog
/api/orders      — Orders
/api/dashboard   — Dashboard aggregates
/api/voice       — Voice agent
/api/chat        — Chat agent
/api/calls       — Calling agent
/api/analytics   — Analytics
```
