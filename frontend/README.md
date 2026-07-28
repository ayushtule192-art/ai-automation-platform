# Frontend — AI Automation Platform

Next.js 15 App Router application with React 19, Tailwind CSS, Shadcn UI, Zustand, and TanStack Query.

## Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 15 | App Router, SSR, RSC |
| React 19 | UI framework |
| Tailwind CSS | Utility-first styling |
| Shadcn UI | Accessible component library |
| Framer Motion | Landing page animations |
| Zustand | Client state (UI, mobile menu) |
| TanStack Query | Server state & API caching |
| next-themes | Dark mode support |

## Getting Started

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript check |

## Project Structure

```
src/
├── app/
│   ├── (marketing)/     # Public landing pages
│   │   ├── layout.tsx     # Navbar + Footer
│   │   └── page.tsx       # Home / landing
│   ├── layout.tsx         # Root layout + providers
│   └── globals.css
├── components/
│   ├── ui/                # Shadcn UI primitives
│   ├── layout/            # Navbar, Footer
│   ├── landing/           # Hero, Features, Pricing, FAQ
│   └── shared/            # ThemeToggle, etc.
├── providers/             # Query + Theme providers
├── stores/                # Zustand stores
├── hooks/                 # Custom React hooks
└── lib/                   # Utils, constants, API client
```

## Landing Page Sections

- **Hero** — headline, CTA, stats, dashboard preview
- **Features** — 8 AI service cards with icons
- **Testimonials** — customer quotes with avatars
- **Pricing** — 3-tier pricing table
- **FAQ** — accordion with common questions
- **CTA** — final conversion banner

All sections are responsive with dark mode support.
