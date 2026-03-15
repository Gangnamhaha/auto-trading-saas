# Learnings — auto-trading-100b

## [2026-03-15] Session: ses_310bb5083fferl5fWDPMlDxN3T

### Project Setup

- Worktree: /Users/cpeoy/auto-trading-saas
- Git: initialized fresh (not existing repo)
- Tech Stack: TypeScript + Next.js 14 + Drizzle ORM + Vitest + Playwright
- Primary Broker: KIS (한국투자증권) REST API (NOT Kiwoom - it's Windows COM only)
- PG: 토스페이먼츠 (Toss Payments)

### Architecture Decisions

- Monorepo structure: packages/trading-engine + packages/web + packages/shared
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (access 15min) + Refresh Token (7days)
- Encryption: AES-256-GCM for broker API keys (never store plaintext)
- CI: GitHub Actions (test → lint → type-check → build)
- Commit: Conventional commits enforced via commitlint + husky

### Key Constraints (Guardrails)

- MVP = Single broker (KIS), Web only, 2 strategies, paper trading mandatory
- NO mobile native app, NO custom strategy builder, NO social trading
- NO plaintext API key storage anywhere
- NO invest return guarantee in any marketing
- 30-day paper trading REQUIRED before live trading unlocked
- Legal gate: must confirm regulatory classification before public launch

### KIS API Key Details

- Sandbox/모의투자 URL: https://openapivts.koreainvestment.com:29443
- Real URL: https://openapi.koreainvestment.com:9443
- Auth: OAuth 2.0 client_credentials flow
- GitHub samples: https://github.com/koreainvestment/open-trading-api

## [2026-03-15] Task 0B: KIS Developers PoC

### Verified Integration Facts

- Core REST endpoints validated for PoC: `/oauth2/tokenP`, `/uapi/domestic-stock/v1/quotations/inquire-price`, `/uapi/domestic-stock/v1/trading/order-cash`, `/uapi/domestic-stock/v1/trading/inquire-balance`
- WebSocket flow validated from KIS samples: `POST /oauth2/Approval` -> connect to `ops.koreainvestment.com` -> subscribe with `approval_key`
- Domain split must be explicit in code/config: demo=`openapivts:29443`, real=`openapi:9443`

### Rate Limit / Reliability Notes

- `EGW00201` is the key runtime signal for per-second throughput breach
- Access token issuance has throttling behavior (`EGW00133`, 1/min window in field reports)
- Mock account throughput is typically lower than real account throughput; limiter defaults should be conservative
- WebSocket infinite reconnect loops are an explicit operational risk (portal notice)

### Implementation Pattern

- Keep token issuance and business requests separated (`getAccessToken` vs quote/order/balance calls)
- Parse account number in 8-2 format (`CANO`, `ACNT_PRDT_CD`) at boundary layer
- Use env guard + optional order execution flag to prevent accidental live order tests

## [2026-03-15] Wave 0 Gate Check — ALL GO

### Legal Structure Confirmed

- Service type: "비자문형 거래자동화 도구 SaaS" (NOT investment advisory)
- Legal risk: 자본시장법 제444조 (5년 이하 징역 or 2억 이하 벌금) if misclassified
- Mandatory disclaimers required on ALL pages: "투자 원금 손실 가능", "과거 수익률이 미래 수익률을 보장하지 않음"
- ToS must state: all investment decisions belong to user, platform is execution tool only

### Pricing Confirmed (from 0C)

- Free: 1 strategy, paper trading only, 5 backtests/month
- Basic: 9,900원/월 — 2 strategies, live trading (after 30d paper), unlimited backtest
- Pro: 29,900원/월 — unlimited strategies, advanced backtest, priority support
- CAC target: 40,000원 | LTV:CAC = Basic 4.2:1, Pro 21:1
- Break-even: 155 paying users

### Competitive Positioning (from 0C)

- Differentiation 1: Korean stock market specialization (3Commas/QuantConnect don't support KRX)
- Differentiation 2: No-code entry (vs Kiwoom OpenAPI which requires coding)
- Differentiation 3: Backtest + live trading one-stop (vs Iruda/Boolio which don't allow strategy customization)
- Target market: 14.1M Korean retail investors (active)

### Wave 1 Next Steps

- Task 1: Project scaffolding (monorepo + CI/CD)
- Working directory: /Users/cpeoy/auto-trading-saas
- Git already initialized

## [2026-03-15] Task 1: Monorepo Initialization ✓ COMPLETE

### Monorepo Structure Created

```
packages/
├── trading-engine/     # TypeScript Node.js trading engine
│   ├── src/
│   ├── src/__tests__/placeholder.test.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── web/                # Next.js 14 App Router web app
│   ├── src/app/
│   ├── src/__tests__/placeholder.test.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.mjs
│   ├── playwright.config.ts
│   └── vitest.config.ts
└── shared/             # Shared types and utilities
    ├── src/
    ├── package.json
    └── tsconfig.json
```

### Key Configuration Files

- **Root package.json**: Workspaces configured, packageManager set to bun@1.3.10
- **turbo.json**: Pipeline configured for build/test/lint/typecheck/dev
- **tsconfig.json**: Strict mode enabled, ES2022 target, bundler module resolution
- **.eslintrc.json**: TypeScript ESLint with @typescript-eslint plugins
- **.prettierrc**: Semi-false, single quotes, 2-space tabs, trailing commas
- **.commitlintrc.json**: Conventional commits enforced
- **.lintstagedrc.json**: Pre-commit hook runs eslint + prettier on staged files
- **.husky/**: Git hooks installed (pre-commit, commit-msg)
- **docker-compose.yml**: PostgreSQL 16 + Redis 7 (Alpine images)
- **.env.example**: Template for all required environment variables
- **.github/workflows/ci.yml**: GitHub Actions CI pipeline

### Verification Results

✓ `bun install` — 1104 packages installed successfully
✓ `bun run typecheck` — All 3 packages pass TypeScript strict mode
✓ `bun run lint` — ESLint + Next.js lint pass, no warnings
✓ `bun run test` — 2 test files pass (placeholder tests in trading-engine + web)
✓ `git commit -m "bad message"` — Rejected by commitlint (type-empty, subject-empty)
✓ `git commit -m "chore: initialize monorepo with CI/CD, testing, and linting"` — Accepted

### Important Implementation Notes

1. **Next.js Config**: Must use `.mjs` extension (not `.ts` or `.js`) because package.json has `"type": "module"`
2. **Web tsconfig.json**: Must explicitly set `rootDir: "./src"` and include `"types": ["vitest/globals"]` for test globals
3. **Vitest**: Web package uses `jsdom` environment, trading-engine uses `node` environment
4. **Husky**: Automatically installed via `prepare` script in root package.json
5. **Turbo**: Requires `packageManager` field in root package.json for workspace detection
6. **Docker Compose**: Removed obsolete `version: '3.8'` field (Docker Compose v2 doesn't require it)

### Packages Installed

**Root devDependencies:**

- @commitlint/cli, @commitlint/config-conventional
- @typescript-eslint/eslint-plugin, @typescript-eslint/parser
- eslint, prettier, husky, lint-staged
- turbo, typescript, vitest

**Web devDependencies (additional):**

- @playwright/test, @types/react, @types/react-dom, @types/node
- eslint-config-next, jsdom

### Next Steps (Task 2+)

- Implement database schema (Drizzle ORM migrations)
- Set up authentication (JWT + refresh token)
- Implement KIS API client with rate limiting
- Create trading engine core logic
- Build web UI for strategy management

## [2026-03-15] Task 2: Auth, Schema, Encryption

### Drizzle + Postgres Patterns Applied

- `packages/shared/src/db/schema.ts` defines `users`, `broker_connections`, `strategies`, `trades`, `trade_logs` with UUID PKs, FK cascade on user-owned entities, and JSONB defaults.
- `packages/shared/drizzle.config.ts` uses drizzle-kit `defineConfig` with `schema`, `out`, `dialect: 'postgresql'`, and `dbCredentials.url` from `DATABASE_URL`.
- Migration SQL can live under `packages/shared/src/db/migrations/` for traceable schema history.

### Auth + Crypto Implementation Notes

- JWT utilities are split by token purpose: access (`15m`) and refresh (`7d`), each with dedicated env secret.
- Password storage uses `bcryptjs` only (`hash` + `compare`), never reversible or plain text.
- Broker credential crypto uses AES-256-GCM with random 96-bit IV and output format `iv:authTag:ciphertext` (hex).
- Encryption keys must be validated as 64-char hex (32 bytes) and must come from env, not source literals.

### Verification + Build Gotcha

- `bun test --filter=auth` and `bun test --filter=encryption` should be run per-package to avoid unrelated workspace test runner incompatibilities.
- In Next.js package tsconfig, `rootDir` must be `"."` (not inherited root default and not `"./src"`) when including `.next/types/**/*.ts`, otherwise `TS6059` fails during `tsc`/`next build`.
