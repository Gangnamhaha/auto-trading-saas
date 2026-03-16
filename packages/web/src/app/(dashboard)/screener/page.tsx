'use client'

import { useState } from 'react'

interface Recommendation {
  rank: number
  symbol: string
  name: string
  market: string
  price: number
  changePct: number
  score: number
  grade: string
  rsi: number
  maStatus: string
  bbPosition: string
  volumeRatio: number
  recommendation: string
  expectedReturn: string
  profitPotential: number
  riskLevel: string
  signals: Array<{ type: string; indicator: string; description: string }>
  aiAnalysis: string
}

const MOCK_DATA: Recommendation[] = [
  {
    rank: 1,
    symbol: '000660',
    name: 'SK하이닉스',
    market: 'KR',
    price: 185000,
    changePct: 3.2,
    score: 92,
    grade: 'S',
    rsi: 24.3,
    maStatus: '골든크로스',
    bbPosition: '하단 이탈',
    volumeRatio: 4.2,
    recommendation: '최고 수익 기대',
    expectedReturn: '+15~25%',
    profitPotential: 95,
    riskLevel: '중',
    signals: [
      {
        type: 'bullish',
        indicator: 'RSI',
        description: 'RSI 24.3 — 극단적 과매도! 강한 반등 임박',
      },
      {
        type: 'bullish',
        indicator: 'MA',
        description: '골든크로스 + 거래량 폭증 동시 발생 (강력 매수 신호)',
      },
      {
        type: 'bullish',
        indicator: 'BB',
        description: '볼린저 하단 이탈 후 복귀 시작 — 평균 회귀 기대',
      },
      {
        type: 'bullish',
        indicator: 'VOL',
        description: '거래량 4.2배 폭증 — 기관/외국인 대량 매수 추정',
      },
      {
        type: 'bullish',
        indicator: 'AI',
        description: 'AI 분석: HBM 수요 급증 + NVIDIA 실적 호조 연동 기대',
      },
    ],
    aiAnalysis:
      'HBM(고대역폭메모리) 글로벌 수요 폭발로 SK하이닉스 실적 급성장 예상. RSI 극단적 과매도 + 골든크로스 + 거래량 폭증이 동시에 나타나는 "트리플 시그널"은 역사적으로 평균 18.7% 반등을 기록. NVIDIA AI GPU 수요와 직결되는 HBM3E 독점 공급 구조가 핵심 모멘텀.',
  },
  {
    rank: 2,
    symbol: 'NVDA',
    name: 'NVIDIA',
    market: 'US',
    price: 875.3,
    changePct: 4.5,
    score: 89,
    grade: 'S',
    rsi: 31.2,
    maStatus: '강한 상승',
    bbPosition: '하단 터치',
    volumeRatio: 3.1,
    recommendation: '최고 수익 기대',
    expectedReturn: '+12~20%',
    profitPotential: 90,
    riskLevel: '중',
    signals: [
      {
        type: 'bullish',
        indicator: 'RSI',
        description: 'RSI 31.2 — 과매도 근접, 반등 타이밍',
      },
      {
        type: 'bullish',
        indicator: 'AI',
        description: 'AI GPU 독점적 시장 지위 + 데이터센터 수요 폭발',
      },
      {
        type: 'bullish',
        indicator: 'VOL',
        description: '거래량 3.1배 — 기관 대량 매수 포착',
      },
      {
        type: 'bullish',
        indicator: 'MOM',
        description: '실적 발표 앞두고 어닝 서프라이즈 기대',
      },
    ],
    aiAnalysis:
      'AI 인프라 투자 사이클의 최대 수혜주. Blackwell GPU 출하 본격화로 다음 분기 매출 300억 달러 이상 예상. 현재 조정은 차익실현 매물에 의한 일시적 하락으로, RSI 과매도 구간 진입은 역사적으로 평균 15.3% 반등 기회.',
  },
  {
    rank: 3,
    symbol: '005930',
    name: '삼성전자',
    market: 'KR',
    price: 72500,
    changePct: 1.8,
    score: 85,
    grade: 'A+',
    rsi: 29.8,
    maStatus: '골든크로스 임박',
    bbPosition: '하단 터치',
    volumeRatio: 2.5,
    recommendation: '강력 매수 관심',
    expectedReturn: '+10~18%',
    profitPotential: 85,
    riskLevel: '낮음',
    signals: [
      {
        type: 'bullish',
        indicator: 'RSI',
        description: 'RSI 29.8 — 과매도! 역사적 바닥권',
      },
      {
        type: 'bullish',
        indicator: 'MA',
        description: '5일선이 20일선 상향 돌파 임박 (골든크로스 D-2)',
      },
      {
        type: 'bullish',
        indicator: 'BB',
        description: '볼린저 하단 터치 — 52주 최저 근접, 반등 기대',
      },
      {
        type: 'bullish',
        indicator: 'AI',
        description: 'AI 메모리 수요 + 파운드리 회복 + 주주환원 확대',
      },
    ],
    aiAnalysis:
      '52주 최저 근접 구간에서 RSI 과매도 + 골든크로스 임박 조합. 삼성전자가 이 패턴을 보인 최근 5회 중 4회(80%)에서 3개월 내 평균 14.2% 상승. HBM3E 양산 본격화 + 파운드리 수율 개선이 촉매.',
  },
  {
    rank: 4,
    symbol: 'AAPL',
    name: 'Apple',
    market: 'US',
    price: 198.5,
    changePct: 2.1,
    score: 79,
    grade: 'A',
    rsi: 36.5,
    maStatus: '상승 전환',
    bbPosition: '하단 근접',
    volumeRatio: 2.3,
    recommendation: '매수 관심',
    expectedReturn: '+8~15%',
    profitPotential: 78,
    riskLevel: '낮음',
    signals: [
      {
        type: 'bullish',
        indicator: 'MA',
        description: '20일선 지지 확인 + 상승 전환 신호',
      },
      {
        type: 'bullish',
        indicator: 'VOL',
        description: '거래량 2.3배 — 기관 매수세 유입',
      },
      {
        type: 'bullish',
        indicator: 'AI',
        description: 'iPhone AI 기능 탑재 + 서비스 매출 역대 최대',
      },
    ],
    aiAnalysis:
      'Apple Intelligence 출시로 iPhone 교체 사이클 기대. 서비스 부문 매출이 전체의 25%를 넘어서며 안정적 성장. 현재 PER 28배는 5년 평균 대비 15% 할인 수준.',
  },
  {
    rank: 5,
    symbol: '035420',
    name: 'NAVER',
    market: 'KR',
    price: 215000,
    changePct: 0.9,
    score: 73,
    grade: 'A',
    rsi: 38.1,
    maStatus: '상승 추세',
    bbPosition: '밴드 내',
    volumeRatio: 1.8,
    recommendation: '매수 관심',
    expectedReturn: '+8~12%',
    profitPotential: 72,
    riskLevel: '중',
    signals: [
      {
        type: 'bullish',
        indicator: 'RSI',
        description: 'RSI 38.1 — 매수 관심 구간',
      },
      {
        type: 'bullish',
        indicator: 'AI',
        description: 'HyperCLOVA X 상용화 + 검색 광고 성장',
      },
    ],
    aiAnalysis:
      'AI 검색 전환 + 클라우드 성장 + 웹툰/커머스 해외 확장. HyperCLOVA X 기반 B2B AI 서비스 매출 본격화 기대.',
  },
  {
    rank: 6,
    symbol: 'TSLA',
    name: 'Tesla',
    market: 'US',
    price: 245.3,
    changePct: -0.5,
    score: 68,
    grade: 'B+',
    rsi: 44.3,
    maStatus: '횡보',
    bbPosition: '밴드 내',
    volumeRatio: 1.5,
    recommendation: '관심 종목',
    expectedReturn: '+5~15%',
    profitPotential: 65,
    riskLevel: '높음',
    signals: [
      {
        type: 'bullish',
        indicator: 'VOL',
        description: '거래량 증가 추세 — 방향 전환 임박',
      },
      {
        type: 'neutral',
        indicator: 'RSI',
        description: 'RSI 44.3 — 중립, 방향성 대기',
      },
    ],
    aiAnalysis:
      'FSD(완전자율주행) 진전 여부가 핵심. 로보택시 발표 이후 실적 가시화 여부에 따라 큰 폭 변동 예상. 변동성 높으나 상승 시 폭발적.',
  },
]

const GRADE_STYLES: Record<string, string> = {
  S: 'bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-lg shadow-red-200',
  'A+': 'bg-red-500 text-white',
  A: 'bg-red-400 text-white',
  'B+': 'bg-orange-400 text-white',
  B: 'bg-yellow-400 text-white',
  C: 'bg-gray-400 text-white',
}

export default function ScreenerPage() {
  const [filter, setFilter] = useState<'all' | 'KR' | 'US'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'score' | 'profit' | 'rsi'>('score')

  const filtered = (
    filter === 'all' ? MOCK_DATA : MOCK_DATA.filter((s) => s.market === filter)
  ).sort((a, b) => {
    if (sortBy === 'profit') return b.profitPotential - a.profitPotential
    if (sortBy === 'rsi') return a.rsi - b.rsi
    return b.score - a.score
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🎯 AI 최고수익 종목 추천</h1>
        <p className="text-gray-500">
          RSI + MA + 볼린저 + 거래량 + AI 복합 분석으로 최고 수익 기대 종목 선별
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        ⚠️ <strong>투자 위험 고지:</strong> 종목 추천은 기술적 분석 참고용이며
        투자 조언이 아닙니다. 모든 투자 판단의 책임은 이용자에게 있습니다. 투자
        원금 손실이 발생할 수 있으며, 과거 수익률이 미래 수익을 보장하지
        않습니다.
      </div>

      {/* 필터 + 정렬 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(['all', 'KR', 'US'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {f === 'all' ? '🌍 전체' : f === 'KR' ? '🇰🇷 한국' : '🇺🇸 미국'}
            </button>
          ))}
        </div>
        <div className="flex gap-2 text-sm">
          <span className="text-gray-500 py-2">정렬:</span>
          {(
            [
              ['score', '종합 점수'],
              ['profit', '수익 기대'],
              ['rsi', 'RSI 낮은순'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortBy(key as typeof sortBy)}
              className={`rounded-lg px-3 py-1.5 ${sortBy === key ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* TOP 종목 하이라이트 */}
      {filtered.length > 0 && filtered[0].score >= 85 && (
        <div className="rounded-2xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-6">
          <div className="flex items-center gap-2 text-sm font-bold text-red-600 mb-3">
            🔥 오늘의 최고 수익 기대 종목
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-xl text-lg font-black ${GRADE_STYLES[filtered[0].grade]}`}
              >
                {filtered[0].grade}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black">{filtered[0].name}</span>
                  <span className="text-gray-400">{filtered[0].symbol}</span>
                  <span className="text-xs">
                    {filtered[0].market === 'KR' ? '🇰🇷' : '🇺🇸'}
                  </span>
                </div>
                <div className="flex gap-4 mt-1">
                  <span className="font-bold text-lg">
                    {filtered[0].market === 'KR'
                      ? `₩${filtered[0].price.toLocaleString()}`
                      : `$${filtered[0].price}`}
                  </span>
                  <span className="text-red-500 font-bold">
                    +{filtered[0].changePct}%
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">기대 수익률</p>
              <p className="text-2xl font-black text-red-600">
                {filtered[0].expectedReturn}
              </p>
              <p className="text-xs text-gray-400">
                종합 {filtered[0].score}점
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-600">{filtered[0].aiAnalysis}</p>
          <p className="mt-2 text-xs text-amber-600">
            ⚠️ 기대 수익률은 과거 패턴 기반 추정이며 보장되지 않습니다.
          </p>
        </div>
      )}

      {/* 종목 리스트 */}
      <div className="space-y-3">
        {filtered.map((stock) => (
          <div
            key={stock.symbol}
            className="rounded-xl border bg-white transition-all hover:shadow-md"
          >
            <div
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() =>
                setExpanded(expanded === stock.symbol ? null : stock.symbol)
              }
            >
              <div className="flex items-center gap-4">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-black ${GRADE_STYLES[stock.grade]}`}
                >
                  {stock.grade}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">
                      {stock.market === 'KR' ? '🇰🇷' : '🇺🇸'}
                    </span>
                    <span className="font-bold">{stock.name}</span>
                    <span className="text-sm text-gray-400">
                      {stock.symbol}
                    </span>
                  </div>
                  <div className="flex gap-3 mt-0.5 text-sm">
                    <span className="font-semibold">
                      {stock.market === 'KR'
                        ? `₩${stock.price.toLocaleString()}`
                        : `$${stock.price}`}
                    </span>
                    <span
                      className={
                        stock.changePct >= 0 ? 'text-red-500' : 'text-blue-500'
                      }
                    >
                      {stock.changePct >= 0 ? '+' : ''}
                      {stock.changePct}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="hidden md:flex gap-4 text-center text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">기대수익</p>
                    <p className="font-bold text-red-500">
                      {stock.expectedReturn}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">RSI</p>
                    <p
                      className={`font-bold ${stock.rsi < 30 ? 'text-red-500' : ''}`}
                    >
                      {stock.rsi}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">거래량</p>
                    <p
                      className={`font-bold ${stock.volumeRatio > 2 ? 'text-red-500' : ''}`}
                    >
                      {stock.volumeRatio}x
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">리스크</p>
                    <p className="font-medium">{stock.riskLevel}</p>
                  </div>
                </div>
                <span
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                    stock.score >= 85
                      ? 'bg-red-100 text-red-700'
                      : stock.score >= 70
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {stock.recommendation}
                </span>
                <span className="text-gray-400">
                  {expanded === stock.symbol ? '▲' : '▼'}
                </span>
              </div>
            </div>

            {expanded === stock.symbol && (
              <div className="border-t px-5 pb-5 pt-3 space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">🤖 AI 분석</h4>
                  <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-3">
                    {stock.aiAnalysis}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">
                    📊 매매 시그널 ({stock.signals.length}개)
                  </h4>
                  <div className="space-y-1.5">
                    {stock.signals.map((signal, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 rounded-lg p-2 text-sm ${
                          signal.type === 'bullish'
                            ? 'bg-red-50 text-red-700'
                            : signal.type === 'bearish'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span>
                          {signal.type === 'bullish'
                            ? '🟢'
                            : signal.type === 'bearish'
                              ? '🔴'
                              : '⚪'}
                        </span>
                        <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded">
                          {signal.indicator}
                        </span>
                        <span>{signal.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center text-sm">
                  <div className="rounded-lg bg-gray-50 p-2">
                    <p className="text-gray-400 text-xs">종합점수</p>
                    <p className="font-black text-lg">{stock.score}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <p className="text-gray-400 text-xs">수익잠재력</p>
                    <p className="font-black text-lg text-red-500">
                      {stock.profitPotential}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <p className="text-gray-400 text-xs">MA 상태</p>
                    <p className="font-medium">{stock.maStatus}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <p className="text-gray-400 text-xs">BB 위치</p>
                    <p className="font-medium">{stock.bbPosition}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  ⚠️ 기술적 분석 참고용이며 투자 조언이 아닙니다. 기대 수익률은
                  과거 패턴 기반이며 보장되지 않습니다.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
