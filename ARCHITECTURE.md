# System architecture

This document describes the architecture of the company website + AI automation platform built for the Senior AI Full Stack Developer assignment.

## Overview diagram

```mermaid
flowchart TB
    subgraph FE["Frontend — Next.js + Tailwind (Render)"]
        FE1["Marketing pages<br/>Home, Login, Services, About/Contact"]
        FE2["Automation UI<br/>Voice/chat widget, order flow"]
    end

    subgraph BE["Backend platform — Node/FastAPI (Render)"]
        BE1["Auth & API<br/>JWT/session, REST endpoints"]
        BE2["Orchestrator<br/>Routes requests, logs conversations"]
    end

    subgraph AI["AI agent layer"]
        A1["Voice agent<br/>STT + LLM + TTS"]
        A2["Calling agent<br/>Outbound calls, reminders"]
        A3["Support agent<br/>Chat, order tracking"]
    end

    subgraph DATA["Data & third-party services"]
        D1[("PostgreSQL<br/>users, orders")]
        D2[("Redis<br/>sessions, cache")]
        D3["Twilio<br/>voice/calling"]
        D4["Claude/GPT API<br/>reasoning"]
        D5["Whisper/Deepgram + ElevenLabs<br/>STT/TTS"]
    end

    FE --> BE
    BE --> AI
    BE2 --> D1
    BE2 --> D2
    A1 --> D3
    A1 --> D5
    A2 --> D3
    A1 --> D4
    A2 --> D4
    A3 --> D4
```

## Layer breakdown

### 1. Frontend — Next.js + Tailwind
- **Marketing pages**: Home, Login/Signup, Services, About/Contact — server-rendered for SEO, responsive for mobile.
- **Automation UI**: the e-commerce/automation page where the AI agents are demoed (voice widget, chat widget, order flow).
- Deployed on Render.

### 2. Backend platform — Node.js (Express/NestJS) or FastAPI
- **Auth & API**: handles login/signup, JWT/session management, and the core REST endpoints for orders and users.
- **Orchestrator**: a service that routes requests between the frontend, the AI agents, and the database; also logs every conversation/call for review.
- Deployed on Render.

### 3. AI agent layer
- **Voice agent**: inbound/outbound voice interactions — speech-to-text → LLM reasoning → text-to-speech.
- **Calling agent**: automated outbound calls (appointment reminders, lead follow-up, cart recovery) via a telephony API.
- **Support agent**: website chat widget for support, product recommendations, and order tracking, using tool-use/function-calling.

### 4. Data & third-party services
- **PostgreSQL**: structured data — users, orders.
- **Redis**: session storage and caching.
- **Twilio**: telephony for voice and calling agents.
- **Claude/GPT API**: the reasoning layer behind all three agents.
- **Whisper/Deepgram + ElevenLabs**: speech-to-text and text-to-speech for the voice agent.

## How this maps to the deliverables checklist
- **Design**: this diagram plus a Figma file covering the frontend pages.
- **Frontend code**: the `FE` layer above, in the same GitHub repo as backend.
- **Backend code**: the `BE` layer, exposing REST/GraphQL APIs.
- **AI agent integration**: at least one working agent from the `AI` layer (voice or chat), documented here with mock/sandbox APIs if needed.
- **Deployment**: live links for both `FE` and `BE`, deployed on Render.
- **Documentation**: this file, plus setup steps in the main README.
