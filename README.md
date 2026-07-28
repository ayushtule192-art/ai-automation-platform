# AI Automation Platform

**Automate Customer Support, Sales, Voice Calls and Business Workflows using AI.**

Production-ready SaaS platform for AI-powered voice agents, calling automation, chat agents, and business workflow orchestration.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, Shadcn UI, Framer Motion, TanStack Query, Zustand |
| Backend | Node.js, Express.js, TypeScript, Prisma, PostgreSQL, Redis, BullMQ, Socket.io |
| AI | OpenAI, LangChain, LangGraph, ElevenLabs, Deepgram, Twilio |
| Auth | JWT, Refresh Tokens, RBAC |
| Deploy | Docker, GitHub Actions, Railway, Vercel |

## Project Structure

```
ai-automation-platform/
├── frontend/          # Next.js 15 App Router application
├── backend/           # Express.js REST API + Socket.io + BullMQ workers
├── docker/            # Dockerfiles and nginx configuration
├── .github/workflows/ # CI/CD pipelines
├── docs/              # Architecture and API documentation
└── scripts/           # Development and deployment scripts
```

## Architecture

```
Frontend (Next.js)
       ↓
   REST API / WebSocket
       ↓
Express Backend
       ↓
Controllers → Services → Repositories
       ↓
   Prisma ORM
       ↓
PostgreSQL + Redis (BullMQ)
```

## Getting Started

> Setup instructions will be added in Steps 2–3 (Backend & Frontend setup).

## Development Roadmap

- [x] **Step 1** — Project folder structure
- [x] **Step 2** — Backend setup
- [x] **Step 3** — Frontend setup
- [x] **Step 4** — Authentication
- [x] **Step 5** — Landing page
- [ ] **Step 6+** — Agents, dashboard, analytics, deployment

## License

Proprietary — All rights reserved.
