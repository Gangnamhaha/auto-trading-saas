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

## [2026-03-15] Task 3: Broker Abstraction + KIS Adapter

### Implementation Learnings

- A strict token-bucket limiter with `maxTokens=5` and `refillRate=5` gives immediate burst capacity for 5 calls while forcing delay on the 6th call inside the same second window.
- KIS adapter reliability is improved by handling HTTP 429 with exponential backoff (`1s`, `2s`, `4s`) and retrying 5xx with fixed delay.
- Token cache should refresh with a safety window (60s before expiry) to reduce `EGW00123` expiration errors during active request flows.
- Logging request headers is safe only when `appkey`, `appsecret`, `authorization`, and token-like values are masked before output.

### Testing Learnings

- `bun test --filter=broker` can execute the full broker test file, so test names should be explicit and assertions must validate each required broker behavior.
- Network-timeout tests need extended timeout budget (>5s) because adapter timeout is implemented at request level using `AbortController`.
- Mocking KIS APIs with staged fetch responses is enough to validate order placement, balance mapping, token refresh behavior, and retry flow without live account calls.

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

## [2026-03-15] Task 7: Risk Layer + Paper Trading

### Risk Guardrail Learnings

- Circuit breaker should aggregate only negative PnL as a daily loss percent, then auto-reset on date rollover before any check/read operation.
- Risk validation order matters for user feedback: circuit breaker first, then position-size cap, then daily-trade cap, then single-stock concentration cap.
- A dedicated `RiskViolationError` carrying typed violation payload makes test assertions deterministic and keeps failure messages actionable.

### Paper Trading Learnings

- Paper broker can safely implement `IBroker` without live API calls by handling all state changes inside `PaperAccount` and asserting `fetch` is never called in tests.
- Virtual account correctness depends on commission-aware cash updates on both buy (`cost + commission`) and sell (`proceeds - commission`) paths.
- Enforcing the 30-day paper period as a hard `switchToLive()` gate captures the business rule where promotion to live trading is blocked before eligibility.

## [2026-03-15] Task 5: Core Dashboard Pages

### Tailwind CSS v4 Migration Notes

- Tailwind CSS v4 requires `@tailwindcss/postcss` package instead of `tailwindcss` as PostCSS plugin
- PostCSS config must use `.cjs` extension when package.json has `"type": "module"`
- CSS file uses `@import "tailwindcss"` instead of `@tailwind` directives
- Custom colors defined via `@theme` block in CSS, not `tailwind.config.ts`

### Next.js App Router Patterns

- Route groups `(auth)` and `(dashboard)` create logical groupings without affecting URL paths
- Each route group can have its own `layout.tsx` for shared UI (auth: centered card, dashboard: sidebar)
- Path alias `@/*` requires `baseUrl` and `paths` in tsconfig.json

### Recharts TypeScript Gotchas

- `Tooltip` formatter receives `ValueType | undefined`, not `number` directly
- Use `Number(value)` to safely convert for formatting
- ResponsiveContainer needs explicit height on parent div for proper rendering

### Component Architecture

- UI components (button, card, input, badge) follow shadcn/ui patterns with `cva` for variants
- Layout components (header, sidebar, footer) are client components with `'use client'`
- Disclaimer component is reusable across all pages for legal compliance

### Build Verification

- `bun run build` in web package validates TypeScript + ESLint + static generation
- 17 routes generated successfully (7 pages + 8 API routes + 2 special routes)
- First Load JS shared chunk is ~87KB, page-specific chunks range 2-5KB

## [2026-03-15] Task 4: Strategy Engine + Backtesting

### Strategy Implementation Learnings

- MA crossover is easiest to keep deterministic by returning full-length MA arrays with `NaN` for insufficient windows, then emitting signals only when both current and previous MA points are valid.
- Golden/death cross detection should use edge transitions (`prev <=/>=`, `current >/<`) to avoid repeated BUY/SELL spam while one MA remains above or below the other.
- Wilder RSI implementation is stable when the first RSI uses simple average gain/loss over `period`, then each next step applies smoothing: `avg = (prevAvg*(period-1)+current)/period`.

### Backtest Engine Learnings

- All-in execution with commission-aware quantity (`cash / (price * (1 + commissionRate))`) guarantees BUY spends available capital without going negative from fees.
- Equity-curve tracking per candle enables direct max drawdown calculation from rolling peak/trough and supports sharpe calculation from daily returns.
- Win rate should be based on closed SELL trades only (realized PnL), while `totalTrades` can remain raw BUY+SELL action count for report transparency.

### Verification Notes

- New tests added: `strategy.test.ts` (10 tests) + `backtest.test.ts` (5 tests), satisfying the minimum strategy coverage requirement.
- `bun test` in `packages/trading-engine` passes with all tests green.
- `bun run typecheck` in `packages/trading-engine` passes under strict TypeScript settings.

## [2026-03-15] Task 6: Subscription Tiers + Toss Billing

### Billing Integration Learnings

- App Router route files only allow HTTP method exports, so reusable webhook processors must live outside route.ts to keep next build passing.
- Subscription gate logic is easiest to keep consistent by splitting checks into tier ordering (hasAccess) and lifecycle status (canAccessWithStatus) including grace and cancellation windows.
- Billing keys must be encrypted before DB write; wiring encrypt() from shared package with env key validation keeps plaintext out of storage paths.

### Verification Notes

- Added billing API routes: subscribe, cancel, status, webhook under src/app/api/billing/.
- Added subscription domain modules for tiers, middleware, service, and webhook event processing with 72-hour grace handling.
- Added subscription.test.ts with tier access, grace period, tier limits, middleware 403 gating, and paid webhook upgrade assertions (12 tests).
- bun test and bun run build in packages/web both pass after route export fix.

## [2026-03-15] Task 9: Playwright E2E + Security Audit

### E2E Test Coverage Notes

- Standardized Playwright test discovery to `packages/web/tests` and switched `webServer.command` to `bun run dev` to match workspace tooling.
- Added auth, dashboard, and responsive viewport E2E suites with selectors aligned to current Next.js UI structure.
- Responsive suite captures viewport evidence screenshots under `.sisyphus/evidence/` for mobile/tablet/desktop smoke validation.

### Security Automation Notes

- Added `security/audit.sh` for plaintext secret pattern scan, sensitive console log checks, encryption-module presence, disclaimer presence, and strict-mode verification.
- Added `security/checklist.md` to track implemented and deferred controls across data, API, legal, and trading-safety domains.
- Root `bun run typecheck` remains green after adding E2E and security artifacts.

## [2026-03-15] Task 8: Landing Page SEO + Marketing Infrastructure

### SEO Implementation Learnings

- Next.js Metadata API in `layout.tsx` supports `title`, `description`, `keywords`, `openGraph`, `twitter`, `robots`, and `alternates` for comprehensive SEO.
- JSON-LD structured data should be injected via `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />` in page components.
- GA4 script integration uses `next/script` with `strategy="afterInteractive"` for non-blocking loading.
- Environment variable `NEXT_PUBLIC_GA4_ID` enables conditional GA4 loading (no hardcoded keys).

### Analytics Library Design

- Event tracking should support both GA4 (`window.gtag`) and Mixpanel (`window.mixpanel`) with a unified `trackEvent()` function.
- Development mode should log events to console instead of sending to analytics services.
- Predefined event names as a const object (`EVENTS`) ensures type safety and consistency across the codebase.
- Helper functions for common tracking scenarios (signup, broker, backtest, strategy, subscription) reduce boilerplate.

### Waitlist Form Implementation

- Form with `action="/api/waitlist" method="POST"` works with Next.js App Router API routes.
- Email validation with regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` catches basic format errors.
- Privacy-conscious tracking should hash emails before logging (e.g., `abc***@domain.com`).

### Blog Content Requirements

- All blog posts must include disclaimer: "⚠️ 투자 원금 손실이 발생할 수 있습니다."
- No profit guarantees or exaggerated claims allowed.
- Frontmatter should include `title`, `date`, `description`, `keywords` for SEO.
- Minimum 800 words per post for SEO value.

### Build Verification

- `bun run build` passes with 18 static pages generated.
- ESLint warnings for `console.log` in development-mode analytics code are acceptable.
- 10 files changed, 880 insertions for Task 8.

## [2026-03-15] Task 10: Production Deploy + Monitoring + Runbook

### Deployment and Ops Learnings

- Split deployment artifacts by runtime boundary: web app (Vercel/Next.js) and trading engine (ECS/Fargate) to avoid coupling engine lifecycle with web process uptime.
- Keep deployment configs secret-safe by referencing managed secret stores (Vercel project secrets, AWS Secrets Manager ARNs) instead of embedding credential values.
- Health endpoint at `/api/health` is useful as an external probe contract and should include timestamp/version plus service-level fields for quick triage context.

### Monitoring and Verification Notes

- Uptime checks should separately monitor web and engine URLs at 60s cadence, with market-hours escalation policy stricter for engine outages.
- `bun run build` at workspace root validates the new health route integration and confirms route generation includes `/api/health`.
- Pre-commit hooks (lint-staged) can format staged JSON/MD/TS files automatically, so deployment/config docs should remain formatter-friendly to reduce commit friction.

## Task 11: 베타 런칭 계획서 및 온보딩 문서 (2026-03-15)

### 완료된 작업

- `docs/beta-launch-plan.md`: 4주 베타 프로그램 계획, KPI, 인센티브 구조
- `docs/onboarding-emails/email-01-welcome.md`: 가입 직후 환영 이메일
- `docs/onboarding-emails/email-02-broker-connect.md`: D+1 브로커 연결 안내
- `docs/onboarding-emails/email-03-first-backtest.md`: D+3 백테스트 안내
- `docs/onboarding-emails/email-04-paper-trading.md`: D+7 페이퍼트레이딩 안내
- `docs/community-guide.md`: 카카오톡/디스코드 운영 규칙, Q&A 프로세스
- `docs/beta-invite-template.md`: 초대 이메일 템플릿 + 발송 체크리스트

### 핵심 비즈니스 규칙 (재확인)

- 모든 문서에 면책 고지 필수: "투자 원금 손실이 발생할 수 있습니다"
- 수익률 보장 문구 절대 금지
- 30일 페이퍼트레이딩 의무 후 실전 전환
- 배치 초대: 10명씩 5회 (500명 이상 동시 초대 금지)

### 기술 메모

- lint-staged + prettier가 md 파일도 포맷팅함 → 커밋 전 자동 처리됨
- `git ls-files docs/`로 추적 파일 확인 가능
- 커밋: ef10581 "docs: add beta launch plan, onboarding emails, and community guide"

## [2026-03-15] Task 13: 커뮤니티 빌딩 전략

### 작성 파일

- `marketing/community/activity-plan.md` — 5개 채널 활동 계획 (네이버 카페, 디시인사이드, 레딧, 클리앙/뽐뿌, 카카오톡/디스코드)
- `marketing/community/post-templates.md` — 커뮤니티 글 템플릿 5종 (교육글, 백테스트 결과, Q&A 답변, 제품 업데이트, 사용자 사례)
- `marketing/community/event-plan.md` — 밋업/웨비나 3개월 계획 (4월 온라인, 5월 온라인, 6월 오프라인)

### 핵심 원칙 (법적 준수)

- 모든 커뮤니티 글에 면책 조항 3단계 버전 적용 (간략/표준/강화)
- 직접 홍보 금지 → 교육 콘텐츠 우선 전략
- 수익률 보장 표현 절대 금지
- 비자문형 거래자동화 도구 포지셔닝 일관 유지

### 이벤트 예산

- 3개월 총 예산: 148만원 (4월 20만, 5월 25만, 6월 103만)
- 6월 오프라인 밋업이 가장 비용 높음 (장소 50만 + 다과 30만)

### KPI 목표 (3개월)

- 카카오톡 오픈채팅: 1,000명
- 디스코드: 200명
- 웨비나 참석자: 4월 30명, 5월 50명
- 오프라인 밋업: 20명 (베타 사용자 중심)

---

## Task 15: 사업 문서 작성 (2026-03-15)

### 완료된 작업

- `business/team-roadmap.md`: 팀 빌딩 4단계 로드맵 + JD 초안 3종 (풀스택 개발자, 콘텐츠 마케터, CS 담당자)
- `business/ir-deck.md`: IR 덱 초안 15슬라이드 (표지~면책 고지)
- `business/financial-plan.md`: 12개월 월별 손익 예측 + 민감도 분석 + Year 2-3 전망
- `business/incorporation-checklist.md`: 주식회사 설립 6단계 체크리스트

### 핵심 수치 (재무 계획)

- 손익분기: Month 10 (유료 사용자 500명)
- Month 12 목표: 유료 사용자 750명, 월 매출 1,125만원, 순이익 +305만원
- 누적 손실 최대: -1,560만원 (Month 9)
- ARPU: ~15,000원/월 (Basic 70% / Pro 30% 믹스)
- LTV:CAC = 12.5:1 (CAC 4만원, LTV 50만원)

### 팀 빌딩 채용 트리거

- Phase 2 (프리랜서 개발자): 베타 사용자 50명 달성 시 (Month 3)
- Phase 3 (마케터): 손익분기 155명 달성 시 (Month 6)
- Phase 4 (CS 담당자): 유료 사용자 400명 이상 시 (Month 9)

### 법인 설립 핵심

- 유료 서비스 전 법인 설립 필수
- 주업종: 소프트웨어 개발 및 공급업 (722000)
- 부업종: 전자상거래 소매업 (479900)
- 총 초기 비용: 약 1,100-1,200만원 (자본금 1,000만원 포함)
- 소요 기간: 약 4-6주

### IR 덱 구성 (15슬라이드)

1. 표지 → 2. 문제 → 3. 솔루션 → 4. TAM/SAM/SOM → 5. 제품 데모
2. 비즈니스 모델 → 7. 트랙션 → 8. 경쟁 분석 → 9. 팀 → 10. 재무 계획
3. 투자 요청 → 12. 성장 전략 → 13. 리스크 → 14. 왜 지금인가 → 15. 면책 고지

### 시드 투자 요청

- 금액: 5억원
- 사용: 개발 40% + 마케팅 40% + 운영 20%
- 런웨이: 18개월
- 목표: PMF 달성 + 시리즈 A 준비

## [2026-03-15] Task 14: 유료 광고 전략

### 완료 내용

- `marketing/ads/channel-strategy.md` — 4개 채널(Google/Meta/YouTube/네이버) 전략서 작성
- `marketing/ads/budget-plan.md` — 12개월 3-Phase 예산 계획 (총 5,250만원)
- `marketing/ads/creative-guidelines.md` — Do/Don't 가이드라인 + 채널별 크리에이티브 가이드
- `marketing/ads/ab-test-plan.md` — 3개 핵심 테스트 + 4개 추가 로드맵
- `marketing/ads/roi-dashboard.md` — Looker Studio 기반 5섹션 대시보드 설계

### 핵심 결정사항

- **법적 준수**: 모든 광고에 "투자 원금 손실 가능. 과거 수익률이 미래를 보장하지 않음." 필수 포함
- **Phase 전략**: 테스트(100만/월) → 최적화(300만/월) → 스케일업(500-1,000만/월)
- **CAC 목표**: 4만원 이하 (LTV:CAC = Basic 4.2:1, Pro 21:1)
- **채널 배분**: Google 40% / Meta 30% / 네이버 19.4% / YouTube 10.6%

### A/B 테스트 우선순위

1. 랜딩페이지 헤드라인 (3변형: 접근성/기술/신뢰)
2. CTA 버튼 문구 (3변형: 무료/백테스트/Pro체험)
3. 가격 표시 방식 (3변형: 월/일/연간)

### ROI 예측 (기본 시나리오)

- 총 광고비: 5,250만원
- 유료 사용자: 630명
- 총 LTV: 3.15억원
- ROI: 500%

### 주의사항

- 수익률 보장 문구 절대 금지 (자본시장법 위반)
- 경쟁사 비교 광고 금지 (법적 리스크)
- Phase 1 완료 전 월 100만원 초과 집행 금지

---

## Task 12: 콘텐츠 마케팅 엔진 구축 (2026-03-15)

### 완료된 작업

- `marketing/content-calendar.md` — 12주 콘텐츠 캘린더 (주 2회 발행, 월/목)
- `marketing/seo-keywords.md` — SEO 키워드 50개 (6개 카테고리, 우선순위 매트릭스 포함)
- `marketing/youtube-scripts/script-01-quickstart.md` — 5분 퀵스타트 스크립트
- `marketing/youtube-scripts/script-02-backtest.md` — 삼성전자 백테스트 실황 스크립트 (10분)
- `marketing/youtube-scripts/script-03-risk-management.md` — 리스크 관리 5가지 스크립트 (8분)
- `marketing/newsletter-template.md` — 주간 뉴스레터 템플릿 (Stibee/Mailchimp 호환)
- `marketing/lead-magnet.md` — 자동매매 입문 가이드 (7챕터, 약 3,000단어)

### 핵심 학습

#### 콘텐츠 전략

- 주 2회 발행(월/목)이 SEO와 구독자 유지에 최적
- 교육/튜토리얼/시장분석/사용자스토리 4개 카테고리 순환이 효과적
- 12주 캘린더로 콘텐츠 고갈 방지 및 일관성 유지

#### SEO 키워드 인사이트

- "주식 자동매매" (40,000/월) 등 고검색량 키워드는 경쟁 높음 → 장기 공략
- "주식 자동매매 합법" (4,000/월, 낮은 경쟁) 같은 롱테일 키워드가 즉시 공략 가능
- 콘텐츠 클러스터 전략: 필러 페이지 + 클러스터 페이지 구조가 SEO에 효과적

#### 유튜브 스크립트 구조

- 인트로 30초 내 훅 필수 (시청자 이탈 방지)
- 면책 고지는 인트로 직후 15~20초 내 배치 (법적 보호 + 신뢰 구축)
- 타임스탬프 제공으로 시청자 편의성 향상

#### 뉴스레터 운영

- 목요일 오전 8시 발송이 오픈율 최적 (시장 개장 전)
- UTM 파라미터로 모든 링크 추적 필수
- 구독자 전용 혜택(PDF 자료 등)으로 구독 유지율 향상

#### 리드 마그넷 설계

- 7챕터 구조: 개념 → 장단점 → 리스크 → 전략 → 백테스팅 → 페이퍼트레이딩 → 체크리스트
- 체크리스트 형식이 실용성 높고 다운로드 유인 강함
- 모든 챕터에 면책 고지 자연스럽게 삽입

#### 면책 고지 원칙

- 모든 콘텐츠에 투자 위험 고지 필수
- "과거 성과는 미래 수익을 보장하지 않음" 문구 반드시 포함
- AutoTrade KR이 투자 자문 서비스가 아님을 명시
- 법적 구조: "비자문형 거래자동화 도구"

### 커밋

- `4dd306a` — docs(marketing): add content calendar, SEO keywords, and YouTube scripts
- 7개 파일, 1,961줄 추가
