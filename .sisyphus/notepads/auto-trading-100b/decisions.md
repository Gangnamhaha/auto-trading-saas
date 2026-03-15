# Decisions — auto-trading-100b

## [2026-03-15] Session: ses_310bb5083fferl5fWDPMlDxN3T

### Tech Stack Decisions

- TypeScript (strict mode) — type safety critical for financial software
- Next.js 14 App Router — best DX for full-stack TypeScript SaaS
- Drizzle ORM — TypeScript-native, best for Postgres
- Vitest — faster than Jest, Vite-based, better ESM support
- Playwright — E2E testing, matches plan requirements
- Turborepo — monorepo build system
- Tailwind CSS + shadcn/ui — fast UI development

### Business Decisions

- Phase 1 revenue target: 500 users / 50 paying (NOT 100억 in year 1)
- 100억 = 3-5 year vision, not year 1 goal
- Pricing: Free / Basic 9,900원/월 / Pro 29,900원/월 (to be confirmed in Task 0C)
- Cloud: Vercel (web) + AWS ECS (trading engine) + AWS RDS (DB) + ElastiCache (Redis)

### 2026-03-15: 경쟁 분석 및 가격 전략 수립 (Task 0C)

- **경쟁사 벤치마크**: 3Commas(글로벌 코인), QuantConnect(전문 퀀트), 키움 OpenAPI(국내 표준) 분석 완료.
- **차별화 포인트**: '국내 주식 특화', '노코드 전략 빌더', '24/7 클라우드 실행'으로 확정.
- **가격 정책**:
  - Free: 페이퍼 트레이딩 전용
  - Basic (9,900원): 실전 매매 입문
  - Pro (29,900원): 무제한 전략 및 고급 기능
- **단위 경제학**: CAC 5만원 이하, LTV:CAC 4.7:1 (Basic 기준) 목표 설정.
- **타겟 페르소나**: 바쁜 직장인, 전략가 자영업자, 효율 중시 개발자 3종 정의.

## [2026-03-15] Task 0C 완료 — 경쟁 분석 심층 데이터 확정

### 실제 조사된 경쟁사 가격 (2026년 기준)

- **3Commas**: Free / $15 / $40 / $110 (월) — 암호화폐 전용, 연간 25% 할인
- **QuantConnect**: Free (무제한 백테스팅) / Researcher(유료) / Team / Firm — 코딩 필수
- **Pionex**: 완전 무료 + 수수료 0.05% — 암호화폐 전용
- **이루다투자**: AUM 0.15~0.5%/년 — ETF 자산배분만, AUM 3,300억, 활성 1만명
- **불리오**: 성과보수 + 0.3~0.5%/년 — AUM 2,000억, 활성 1.3만명
- **키움 OpenAPI**: 무료 — Windows COM 전용, 코딩 필수, 백테스팅 없음

### 시장 규모 확정 데이터

- 국내 개인 주식투자자: **1,410만명** (2024년 한국예탁결제원 공식 통계)
- 50대 최다 (316만명, 22.4%), 40대 (312만명), 30대 (265만명)
- 코스피 1,248만명, 코스닥 809만명

### 가격 전략 최종 확정

- Basic 9,900원/월 (연 89,000원) — 경쟁사 대비 50% 저렴
- Pro 29,900원/월 (연 269,000원) — 3Commas Pro($40) 대비 저렴
- LTV:CAC = Basic 4.2:1, Pro 21:1 (SaaS 건전 기준 3:1 이상 충족)
- 손익분기: 유료 155명 (Basic 109 + Pro 46)

### 차별화 포인트 최종 확정 (3개)

1. 한국 주식 시장 특화 (글로벌 경쟁사 완전 공백)
2. 노코드 진입 장벽 최소화 (키움 OpenAPI 대비)
3. 백테스팅 + 실전 원스톱 (이루다투자/불리오 대비)
