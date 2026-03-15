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
