# ETF Portfolio Copilot

ETF Portfolio Copilot is a full-stack TypeScript application built around a focused portfolio-management problem: helping ETF investors move from portfolio visibility to concrete next actions. The project combines authenticated product flows, deterministic portfolio calculations, relational data modeling, and deployment-aware verification into a narrow but complete MVP.

For a technical reviewer, the repo is most useful as an example of a focused full-stack system with separable business logic, clear workflow boundaries, and production-minded verification and deployment checks.

## Technical highlights

- End-to-end product slice: sign-up, onboarding, dashboard, portfolio workspace, recommendations, and rebalance flows
- Deterministic business logic for allocation drift, next-buy recommendations, and rebalance simulation
- Layered structure that keeps routing, UI, services, and calculations separate
- Relational persistence for portfolios, accounts, holdings, targets, prices, and user auth data
- Verification discipline through lint, tests, typecheck, production build, browser E2E, deploy-time checks, and smoke checks
- Explicit MVP boundaries and operational constraints

## Product scope

- Email/password sign-up and sign-in with guided onboarding
- Create a first portfolio manually or load a seeded sample portfolio
- Track accounts, ETF holdings, valuations, and target allocations
- View allocation, exposure, drift, and concentration signals
- Generate deterministic next-buy recommendations
- Simulate buy-only and full rebalance scenarios
- Expose authenticated portfolio APIs plus deployment-oriented verification and smoke-check tooling

## Architecture

The repository is organized to keep portfolio rules and persistence concerns out of the UI layer.

- `app/` — route handlers, pages, and server entry points
- `components/` — product UI, forms, dashboard surfaces, and portfolio views
- `lib/services/` — application workflows and orchestration
- `lib/calculations/` — deterministic portfolio math for allocation, drift, recommendation, and rebalance behavior
- `prisma/` — schema, migrations, and seed integration
- `scripts/` — deploy checks, smoke checks, and manual price refresh utilities
- `tests/` — Vitest and Playwright coverage

This shape keeps route handlers focused on interaction and auth boundaries while moving domain behavior into reusable services and calculation modules.

## Core engineering decisions

### Deterministic recommendation and rebalance logic

The recommendation engine is intentionally explainable rather than optimization-heavy. New contribution dollars are directed using portfolio drift and underweight signals, and rebalance behavior is modeled as deterministic buy-only or full rebalance simulation. That keeps the system easier to validate, test, and discuss.

### Layered boundaries instead of logic in routes

UI and route handlers focus on interaction, validation, and auth boundaries. Portfolio workflows live in services, while portfolio math lives in calculation modules. That separation makes the repo easier to extend and reduces coupling between transport concerns and domain rules.

### Production-aware verification

The repo includes more than local happy-path setup. It has an explicit runtime check, a combined verification gate, Playwright flows for authenticated product behavior, deploy-time environment checks, a health endpoint, and HTTP smoke tooling for post-deploy validation.

## Current constraints and boundaries

This project is intentionally narrow. It is built as an MVP around explainable portfolio workflows rather than brokerage integration or live trading.

It is a software project, not investment advice.

Current constraints backed by the repo:

- one portfolio per user
- credentials-based auth
- daily/latest price snapshots rather than real-time pricing
- manual or env-provided quote refresh input for the current price refresh flow
- seeded sample onboarding for a fast demo path

## Verification

Run the full local verification gate:

```bash
pnpm verify
```

That command runs:

- supported Node runtime check
- lint
- unit/integration tests
- typecheck
- production build

Useful individual commands:

```bash
pnpm lint
pnpm test
pnpm typecheck
pnpm build
pnpm e2e:install
pnpm e2e
pnpm deploy:check
pnpm smoke:http
```

### Browser E2E coverage

The Playwright suite uses bundled Chromium and currently covers:

- sign-up → onboarding → sample portfolio setup → dashboard
- protected-route return-path sign-in
- manual onboarding → dashboard mutation → workspace navigation

Install the browser binary once:

```bash
pnpm e2e:install
```

Run the suite:

```bash
pnpm e2e
```

## Deployment readiness

The repository includes deployment-oriented checks and production validation steps, but production still requires external Vercel and PostgreSQL infrastructure.

Production environment variables:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `CRON_SECRET`
- `PRICE_REFRESH_QUOTES_JSON` only if you want the current stubbed refresh flow to do useful work

Recommended deployment flow:

1. Create a managed PostgreSQL database
2. Create a Vercel project for the repo
3. Configure production environment variables
4. Run production-safe migrations:

   ```bash
   pnpm prisma:migrate:deploy
   ```

5. Validate deploy-time env wiring:

   ```bash
   pnpm deploy:check
   ```

6. Smoke-test key routes after deploy:

   - `/`
   - `/api/health`
   - `/sign-in`
   - `/dashboard` after sign-in
   - `/api/portfolios` returns `401` when unauthenticated

You can also run the HTTP smoke script against a deployed base URL:

```bash
SMOKE_BASE_URL="https://your-deployment.example.com" pnpm smoke:http
```

## Tech stack

- **Next.js 16**
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Prisma 7**
- **PostgreSQL**
- **Auth.js / NextAuth**
- **Recharts**
- **Vitest**
- **Playwright**
- **Vercel-compatible deployment flow** with PostgreSQL-backed persistence

## Local setup

### Prerequisites

- Node.js `20.19+`, `22.12+`, or `24.x`
- `pnpm` `10.33.0`
- PostgreSQL

The repo includes `.nvmrc` plus a runtime preflight check.

If you use `nvm`:

```bash
nvm use
```

### Install and run

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

3. Set local values in `.env`.

   Minimum variables:

   ```bash
   DATABASE_URL=
   AUTH_SECRET=
   AUTH_URL=http://localhost:3000
   CRON_SECRET=
   ```

   Optional demo/stub quote input:

   ```bash
   PRICE_REFRESH_QUOTES_JSON='[{"ticker":"XEQT","priceDate":"2026-04-16","closePrice":"33.9500"}]'
   ```

4. Generate the Prisma client, run migrations, and seed the database:

   ```bash
   pnpm prisma:generate
   pnpm prisma:migrate --name init
   pnpm prisma:seed
   ```

5. Start the app:

   ```bash
   pnpm dev
   ```

6. Open `http://localhost:3000`.

## How to try it locally

The fastest demo path is:

1. Open `/sign-up`
2. Create an account with any valid email and an 8+ character password
3. Continue into onboarding
4. Choose the seeded sample portfolio option for a ready-made walkthrough
5. Open the dashboard, workspace, recommendation, and rebalance flows

## Manual price refresh

The current price refresh flow is not a live market-data integration. It expects a controlled quote payload through `PRICE_REFRESH_QUOTES_JSON` or a future quote provider implementation.

Run the refresh script locally:

```bash
pnpm prices:refresh
```

Test with a temporary payload:

```bash
PRICE_REFRESH_QUOTES_JSON='[{"ticker":"XEQT","priceDate":"2026-04-18","closePrice":"34.5600"}]' pnpm prices:refresh
```

## MVP boundaries

This project does **not** currently aim to provide:

- broker account syncing
- tax optimization
- real-time pricing
- full ETF holdings ingestion
- opaque AI-generated portfolio advice

The app is intentionally focused on deterministic, explainable portfolio support for a narrow ETF investing workflow.

## Project status

This repository currently implements the core MVP flows:

- core portfolio flows are implemented
- automated verification and browser coverage are in place
- deployment scripts and health/smoke checks exist
- production still uses a stubbed/manual quote refresh input rather than a live market-data provider

## License

No license file is currently included in this repository. If you plan to share or reuse the project publicly, add an explicit license before broad distribution.
