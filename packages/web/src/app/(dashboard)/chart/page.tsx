'use client'

import { useState } from 'react'
import { TradingChart } from '@/components/charts/trading-chart'

const SYMBOLS = [
  { code: '005930', name: '삼성전자', market: 'KR' },
  { code: '000660', name: 'SK하이닉스', market: 'KR' },
  { code: '035720', name: '카카오', market: 'KR' },
  { code: 'AAPL', name: 'Apple', market: 'US' },
  { code: 'TSLA', name: 'Tesla', market: 'US' },
  { code: 'MSFT', name: 'Microsoft', market: 'US' },
]

export default function ChartPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('005930')
  const [showMA, setShowMA] = useState(true)
  const [showBollinger, setShowBollinger] = useState(false)
  const [showVolume, setShowVolume] = useState(true)

  const symbolInfo = SYMBOLS.find((s) => s.code === selectedSymbol)

  // 더미 매매 시그널
  const markers = [
    {
      time: '2026-02-15',
      position: 'belowBar' as const,
      color: '#ef4444',
      shape: 'arrowUp' as const,
      text: 'BUY',
    },
    {
      time: '2026-03-01',
      position: 'aboveBar' as const,
      color: '#3b82f6',
      shape: 'arrowDown' as const,
      text: 'SELL',
    },
    {
      time: '2026-03-10',
      position: 'belowBar' as const,
      color: '#ef4444',
      shape: 'arrowUp' as const,
      text: 'BUY',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">실시간 차트</h1>
        <p className="text-gray-500">TradingView 스타일 캔들스틱 차트</p>
      </div>

      {/* 종목 선택 + 인디케이터 토글 */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          {SYMBOLS.map((s) => (
            <button
              key={s.code}
              onClick={() => setSelectedSymbol(s.code)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedSymbol === s.code
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-1">{s.market === 'KR' ? '🇰🇷' : '🇺🇸'}</span>
              {s.name}
            </button>
          ))}
        </div>

        <div className="flex gap-3 border-l pl-4">
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={showMA}
              onChange={(e) => setShowMA(e.target.checked)}
              className="rounded"
            />
            이동평균
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={showBollinger}
              onChange={(e) => setShowBollinger(e.target.checked)}
              className="rounded"
            />
            볼린저밴드
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={showVolume}
              onChange={(e) => setShowVolume(e.target.checked)}
              className="rounded"
            />
            거래량
          </label>
        </div>
      </div>

      {/* 차트 */}
      <TradingChart
        key={`${selectedSymbol}-${showMA}-${showBollinger}-${showVolume}`}
        symbol={selectedSymbol}
        markers={markers}
        height={600}
        showMA={showMA}
        showBollinger={showBollinger}
        showVolume={showVolume}
      />

      {/* 종목 정보 */}
      <div className="rounded-lg border bg-white p-4">
        <h3 className="font-semibold">
          {symbolInfo?.name} ({selectedSymbol})
        </h3>
        <p className="text-sm text-gray-500">
          {symbolInfo?.market === 'KR'
            ? '한국 주식시장 (KOSPI/KOSDAQ)'
            : '미국 주식시장 (NYSE/NASDAQ)'}
        </p>
        <p className="mt-2 text-xs text-gray-400">
          ⚠️ 차트 데이터는 데모용이며 실제 시세와 다를 수 있습니다. 투자 원금
          손실이 발생할 수 있습니다.
        </p>
      </div>
    </div>
  )
}
