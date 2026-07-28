# Project Structure

Complete folder layout for the AI Automation Platform monorepo.

## Root

```
ai-automation-platform/
├── .github/workflows/     # CI/CD (lint, test, build, deploy)
├── docker/
│   ├── backend/           # Backend Dockerfile
│   ├── frontend/          # Frontend Dockerfile
│   └── nginx/             # Reverse proxy config
├── docs/                  # Architecture, API, deployment guides
├── scripts/               # Dev & ops scripts
├── frontend/              # Next.js application
├── backend/               # Express API server
├── docker-compose.yml     # (Step 2+) Local dev stack
├── .gitignore
└── README.md
```

---

## Backend (`/backend`)

Follows **MVC + Repository Pattern + Service Layer**.

```
backend/
├── prisma/
│   ├── schema.prisma      # Database models
│   └── migrations/        # Prisma migrations
├── src/
│   ├── config/            # App, DB, Redis, JWT, AI provider configs
│   ├── constants/         # HTTP codes, roles, queue names, enums
│   ├── controllers/       # HTTP request handlers (thin layer)
│   │   ├── auth/
│   │   ├── users/
│   │   ├── dashboard/
│   │   ├── services/
│   │   ├── orders/
│   │   ├── voice/
│   │   ├── calls/
│   │   ├── chat/
│   │   ├── analytics/
│   │   └── notifications/
│   ├── services/          # Business logic layer
│   │   ├── auth/
│   │   ├── users/
│   │   ├── dashboard/
│   │   ├── services/
│   │   ├── orders/
│   │   ├── voice/
│   │   ├── calls/
│   │   ├── chat/
│   │   ├── analytics/
│   │   └── notifications/
│   ├── repositories/      # Data access layer (Prisma)
│   │   ├── auth/
│   │   ├── users/
│   │   ├── services/
│   │   ├── orders/
│   │   ├── calls/
│   │   ├── conversations/
│   │   └── analytics/
│   ├── middlewares/       # auth, rbac, validate, rateLimit, errorHandler
│   ├── routes/            # Express route definitions
│   ├── validators/        # Zod/Joi request validation schemas
│   │   ├── auth/
│   │   ├── users/
│   │   ├── services/
│   │   ├── orders/
│   │   ├── voice/
│   │   ├── calls/
│   │   └── chat/
│   ├── dtos/              # Data transfer objects
│   │   ├── auth/
│   │   ├── users/
│   │   ├── services/
│   │   ├── orders/
│   │   ├── voice/
│   │   ├── calls/
│   │   ├── chat/
│   │   └── analytics/
│   ├── types/             # TypeScript type aliases
│   ├── interfaces/        # TypeScript interfaces & contracts
│   ├── utils/             # Helpers (logger, crypto, pagination, etc.)
│   ├── lib/               # Third-party wrappers (prisma client, redis)
│   ├── socket/            # Socket.io handlers & namespaces
│   ├── jobs/              # BullMQ workers & queue definitions
│   │   ├── email/
│   │   ├── calling/
│   │   └── notification/
│   ├── agents/            # AI agent implementations
│   │   ├── voice/         # Real-time voice agent (STT → LLM → TTS)
│   │   ├── chat/          # Chat agent with streaming & memory
│   │   ├── calling/       # Outbound Twilio calling agent
│   │   ├── workflows/     # LangGraph workflow definitions
│   │   ├── tools/         # OpenAI function calling tools
│   │   └── prompts/       # Prompt templates
│   ├── modules/           # Feature module barrel exports / DI wiring
│   ├── app.ts             # Express app setup
│   └── server.ts          # HTTP + Socket.io entry point
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

### API Routes (planned)

| Prefix | Module |
|--------|--------|
| `/api/auth` | Authentication |
| `/api/users` | User management |
| `/api/services` | Service catalog |
| `/api/orders` | Orders & billing |
| `/api/dashboard` | Dashboard aggregates |
| `/api/voice` | Voice agent |
| `/api/chat` | Chat agent |
| `/api/calls` | Calling agent |
| `/api/analytics` | Analytics & reporting |

### Database Models (planned)

Users · Services · Orders · Customers · Calls · Conversations · Messages · Analytics

---

## Frontend (`/frontend`)

Next.js 15 **App Router** with route groups.

```
frontend/
├── public/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── src/
│   ├── app/
│   │   ├── (marketing)/           # Public landing pages
│   │   │   ├── page.tsx           # Home / landing
│   │   │   ├── about/
│   │   │   ├── services/
│   │   │   │   └── [slug]/        # Individual service pages
│   │   │   ├── pricing/
│   │   │   └── contact/
│   │   ├── (auth)/                # Auth pages (no dashboard layout)
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── forgot-password/
│   │   ├── (dashboard)/           # Protected dashboard routes
│   │   │   ├── dashboard/         # Overview
│   │   │   ├── voice-agent/
│   │   │   ├── calling-agent/
│   │   │   ├── chat-agent/
│   │   │   ├── analytics/
│   │   │   ├── settings/
│   │   │   ├── profile/
│   │   │   ├── customers/
│   │   │   ├── orders/
│   │   │   ├── call-logs/
│   │   │   └── conversations/
│   │   ├── admin/                 # Admin panel
│   │   │   ├── users/
│   │   │   ├── services/
│   │   │   ├── orders/
│   │   │   ├── analytics/
│   │   │   └── call-logs/
│   │   ├── api/                   # Next.js API routes (BFF if needed)
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                    # Shadcn UI primitives
│   │   ├── layout/                # Header, Footer, Sidebar, Navbar
│   │   ├── landing/               # Hero, Features, Testimonials, FAQ
│   │   ├── dashboard/             # Dashboard widgets & cards
│   │   ├── auth/                  # Login, Signup forms
│   │   ├── voice/                 # Voice agent UI
│   │   ├── calling/               # CSV upload, call scheduler
│   │   ├── chat/                  # Chat interface
│   │   ├── analytics/             # Charts & metrics
│   │   ├── shared/                # Reusable cross-feature components
│   │   └── forms/                 # Form field components
│   ├── hooks/                     # Custom React hooks
│   ├── lib/                       # API client, utils, validations
│   ├── stores/                    # Zustand stores
│   ├── types/                     # Shared TypeScript types
│   ├── constants/                 # App constants
│   ├── providers/                 # React context providers
│   └── styles/                    # Global styles & Tailwind extensions
└── tests/
    ├── unit/
    └── e2e/
```

---

## Cross-Cutting Concerns

| Concern | Location |
|---------|----------|
| Authentication | Backend `auth` module + Frontend `(auth)` routes |
| Realtime | Backend `socket/` + Frontend Socket.io client in `lib/` |
| Background jobs | Backend `jobs/` (BullMQ + Redis) |
| AI agents | Backend `agents/` (OpenAI, LangChain, LangGraph) |
| Admin panel | Frontend `app/admin/` + Backend RBAC middleware |
| Deployment | `docker/`, `.github/workflows/`, Railway + Vercel configs |
