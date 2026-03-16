# 🚀 Alphix — 한국/미국 주식 + 암호화폐 자동매매 SaaS

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Gangnamhaha/alphix&project-name=autotrade-kr&root-directory=packages/web)

> ⚠️ 투자 원금 손실이 발생할 수 있습니다. 과거 수익률이 미래 수익률을 보장하지 않습니다.

## 📊 프로젝트 현황

| 항목   | 수치                                             |
| ------ | ------------------------------------------------ |
| 테스트 | 120+ PASS                                        |
| 브로커 | 6개 (KIS, KIS해외, Alpaca, 키움, Binance, Upbit) |
| 전략   | 6개 (MA, RSI, 볼린저, MACD, 그리드, AI)          |
| 시장   | 🇰🇷한국 + 🇺🇸미국 + 🌐암호화폐                     |
| 플랫폼 | 웹 + 모바일 PWA + 텔레그램 봇                    |

## 🏗️ 아키텍처

```
packages/
├── trading-engine/    # 자동매매 핵심 엔진
│   ├── broker/        # 6개 브로커 어댑터
│   ├── strategy/      # 6개 전략 (AI 포함)
│   ├── backtest/      # 백테스팅 엔진
│   ├── risk/          # 리스크 관리 + 회로차단기
│   ├── paper/         # 페이퍼트레이딩
│   ├── data/          # WebSocket 실시간 데이터
│   ├── daemon/        # 자동매매 데몬
│   ├── notifications/ # 알림 (Console/Webhook)
│   └── telegram/      # 텔레그램 봇
├── web/               # Next.js 14 SaaS 대시보드
│   ├── 8 pages        # 랜딩/대시보드/전략/백테스트
│   ├── 16 API routes  # 인증/결제/엔진/트레이딩
│   └── PWA            # 모바일 앱 설치 + 푸시알림
└── shared/            # DB 스키마 + 암호화
```

## 🚀 빠른 시작

```bash
# 클론
git clone https://github.com/Gangnamhaha/alphix
cd alphix

# 설치
bun install

# 개발 서버
bun run dev        # http://localhost:3000

# 테스트
bun run test       # 120+ 테스트 실행

# 자동매매 데몬 (페이퍼 모드)
cd packages/trading-engine
bun run daemon:paper
```

## 📱 지원 브로커

| 브로커                | 시장     | 설명                |
| --------------------- | -------- | ------------------- |
| 🇰🇷 한국투자증권 (KIS) | 국내주식 | KOSPI/KOSDAQ        |
| 🇺🇸 KIS 해외주식       | 미국주식 | NYSE/NASDAQ via KIS |
| 🇺🇸 Alpaca             | 미국주식 | 무료 Paper Trading  |
| 🇰🇷 키움증권           | 국내주식 | Windows 프록시      |
| 🌐 Binance            | 암호화폐 | 글로벌              |
| 🇰🇷 Upbit              | 암호화폐 | 한국                |

## 📈 전략

| 전략            | 설명                  | 티어  |
| --------------- | --------------------- | ----- |
| MA 크로스오버   | 5/20일 이동평균 교차  | Free  |
| RSI             | 과매수(70)/과매도(30) | Free  |
| 볼린저밴드      | 밴드 터치 매매        | Basic |
| MACD            | MACD/시그널 크로스    | Basic |
| 그리드 트레이딩 | 가격 구간 자동 매매   | Pro   |
| AI 분석         | GPT-4o/Claude LLM     | Pro   |

## 💰 요금제

| Free            | Basic (9,900원/월) | Pro (29,900원/월) |
| --------------- | ------------------ | ----------------- |
| 전략 1개        | 전략 3개           | 전략 무제한       |
| 페이퍼만        | 실전 거래          | 실전 거래         |
| 백테스트 5회/월 | 백테스트 무제한    | AI 전략 포함      |

## 🔒 보안

- AES-256-GCM API 키 암호화
- bcrypt 비밀번호 해싱
- JWT 인증 (15분 만료)
- 회로차단기 (일일 손실 제한)
- 30일 페이퍼트레이딩 의무

## 📄 라이선스

MIT

---

⚠️ **면책 고지**: 본 서비스는 투자자문이 아닌 기술적 자동주문 도구입니다. 모든 투자 판단의 책임은 이용자에게 있습니다. 투자 원금 손실이 발생할 수 있으며, 과거 수익률이 미래 수익률을 보장하지 않습니다.
