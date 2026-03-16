'use client'

import { useState } from 'react'
import { TradingChart } from '@/components/charts/trading-chart'

interface BacktestResult {
  totalReturn: number
  maxDrawdown: number
  sharpeRatio: number
  winRate: number
  totalTrades: number
  winTrades: number
  lossTrades: number
  avgWin: number
  avgLoss: number
  profitFactor: number
  finalCapital: number
  maxConsecutiveWins: number
  maxConsecutiveLosses: number
  equityCurve: Array<{ time: string; value: number }>
  trades: Array<{
    time: string
    side: 'BUY' | 'SELL'
    price: number
    pnl: number
  }>
  candles: Array<{
    time: string
    open: number
    high: number
    low: number
    close: number
    volume: number
  }>
}

const STRATEGIES = [
  { id: 'ma_crossover', name: 'MA 크로스오버', params: '5일/20일' },
  { id: 'rsi', name: 'RSI', params: '14일, 30/70' },
  { id: 'bollinger', name: '볼린저밴드', params: '20일, 2σ' },
  { id: 'macd', name: 'MACD', params: '12/26/9' },
  { id: 'grid', name: '그리드 트레이딩', params: '6만~8만, 10격자' },
  { id: 'ai', name: 'AI 분석', params: 'GPT-4o' },
]

const SYMBOLS = [
  { code: '005930', name: '삼성전자', market: 'KR' },
  { code: '000660', name: 'SK하이닉스', market: 'KR' },
  { code: 'AAPL', name: 'Apple', market: 'US' },
  { code: 'NVDA', name: 'NVIDIA', market: 'US' },
  { code: 'TSLA', name: 'Tesla', market: 'US' },
]

function generateMockResult(strategy: string, symbol: string): BacktestResult {
  const basePrice =
    symbol === 'AAPL'
      ? 180
      : symbol === 'NVDA'
        ? 700
        : symbol === 'TSLA'
          ? 200
          : 68000
  const candles = []
  const equityCurve = []
  const trades = []
  let price = basePrice
  let capital = 10000000
  const isKR = basePrice > 1000

  for (let i = 90; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    if (date.getDay() === 0 || date.getDay() === 6) continue

    const change = (Math.random() - 0.47) * price * 0.025
    const open = price
    const close = price + change
    const high = Math.max(open, close) + Math.random() * price * 0.01
    const low = Math.min(open, close) - Math.random() * price * 0.01
    price = close

    candles.push({
      time: date.toISOString().split('T')[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round(Math.random() * 1000000 + 500000),
    })

    // 랜덤 매매
    if (Math.random() < 0.08) {
      const side = Math.random() > 0.45 ? ('BUY' as const) : ('SELL' as const)
      const pnl =
        side === 'SELL'
          ? Math.round((Math.random() - 0.35) * (isKR ? 50000 : 500))
          : 0
      capital += pnl
      trades.push({
        time: date.toISOString().split('T')[0],
        side,
        price: Math.round(close * 100) / 100,
        pnl,
      })
    }

    equityCurve.push({ time: date.toISOString().split('T')[0], value: capital })
  }

  const winTrades = trades.filter((t) => t.pnl > 0).length
  const lossTrades = trades.filter((t) => t.pnl < 0).length
  const totalReturn = ((capital - 10000000) / 10000000) * 100

  return {
    totalReturn: Math.round(totalReturn * 10) / 10,
    maxDrawdown: -(Math.random() * 8 + 3).toFixed(1) as unknown as number,
    sharpeRatio: +(Math.random() * 1.5 + 0.5).toFixed(2),
    winRate:
      trades.length > 0 ? Math.round((winTrades / trades.length) * 100) : 0,
    totalTrades: trades.length,
    winTrades,
    lossTrades,
    avgWin: Math.round(
      Math.random() * (isKR ? 30000 : 300) + (isKR ? 10000 : 100)
    ),
    avgLoss: -Math.round(
      Math.random() * (isKR ? 20000 : 200) + (isKR ? 5000 : 50)
    ),
    profitFactor: +(Math.random() * 1.5 + 1).toFixed(2),
    finalCapital: capital,
    maxConsecutiveWins: Math.floor(Math.random() * 5 + 2),
    maxConsecutiveLosses: Math.floor(Math.random() * 3 + 1),
    equityCurve,
    trades,
    candles,
  }
}

export default function BacktestPage() {
  const [strategy, setStrategy] = useState('ma_crossover')
  const [symbol, setSymbol] = useState('005930')
  const [period, setPeriod] = useState('3m')
  const [capital, setCapital] = useState('10000000')
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [running, setRunning] = useState(false)

  const runBacktest = () => {
    setRunning(true)
    setTimeout(() => {
      setResult(generateMockResult(strategy, symbol))
      setRunning(false)
    }, 1500)
  }

  const markers =
    result?.trades.map((t) => ({
      time: t.time,
      position: (t.side === 'BUY' ? 'belowBar' : 'aboveBar') as
        | 'belowBar'
        | 'aboveBar',
      color: t.side === 'BUY' ? '#ef4444' : '#3b82f6',
      shape: (t.side === 'BUY' ? 'arrowUp' : 'arrowDown') as
        | 'arrowUp'
        | 'arrowDown',
      text: t.side === 'BUY' ? 'B' : 'S',
    })) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🧪 백테스팅</h1>
        <p className="text-gray-500">과거 데이터로 전략을 검증하세요</p>
      </div>

      {/* 설정 패널 */}
      <div className="rounded-xl border bg-white p-5">
        <div className="grid gap-4 md:grid-cols-5">
          <div>
            <label className="text-sm font-medium text-gray-600">전략</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              {STRATEGIES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.params})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">종목</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              {SYMBOLS.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.market === 'KR' ? '🇰🇷' : '🇺🇸'} {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">기간</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              <option value="1m">1개월</option>
              <option value="3m">3개월</option>
              <option value="6m">6개월</option>
              <option value="1y">1년</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">
              초기 자본
            </label>
            <input
              type="text"
              value={capital}
              onChange={(e) => setCapital(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={runBacktest}
              disabled={running}
              className={`w-full rounded-xl py-2.5 font-bold text-white shadow-lg transition-all ${running ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}
            >
              {running ? '⏳ 분석 중...' : '🚀 백테스트 실행'}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <>
          {/* 성과 지표 카드 */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-6">
            <MetricCard
              label="총 수익률"
              value={`${result.totalReturn > 0 ? '+' : ''}${result.totalReturn}%`}
              color={result.totalReturn >= 0 ? 'red' : 'blue'}
            />
            <MetricCard
              label="최대 낙폭"
              value={`${result.maxDrawdown}%`}
              color="blue"
            />
            <MetricCard
              label="샤프 비율"
              value={`${result.sharpeRatio}`}
              color={result.sharpeRatio >= 1 ? 'green' : 'gray'}
            />
            <MetricCard
              label="승률"
              value={`${result.winRate}%`}
              color={result.winRate >= 55 ? 'green' : 'gray'}
            />
            <MetricCard
              label="총 거래"
              value={`${result.totalTrades}건`}
              color="gray"
            />
            <MetricCard
              label="Profit Factor"
              value={`${result.profitFactor}`}
              color={result.profitFactor >= 1.5 ? 'green' : 'gray'}
            />
          </div>

          {/* 차트: 캔들스틱 + 매매 마커 */}
          <div>
            <h3 className="font-bold mb-2">📊 매매 시그널 차트</h3>
            <TradingChart
              key={`${symbol}-${strategy}-bt`}
              symbol={symbol}
              data={result.candles}
              markers={markers}
              height={500}
              showMA={true}
              showBollinger={strategy === 'bollinger'}
              showVolume={true}
            />
          </div>

          {/* 상세 통계 */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-4">
              <h3 className="font-bold mb-3">📊 상세 통계</h3>
              <div className="space-y-2 text-sm">
                <StatRow
                  label="최종 자본"
                  value={`₩${result.finalCapital.toLocaleString()}`}
                />
                <StatRow
                  label="수익 거래"
                  value={`${result.winTrades}건`}
                  highlight="green"
                />
                <StatRow
                  label="손실 거래"
                  value={`${result.lossTrades}건`}
                  highlight="red"
                />
                <StatRow
                  label="평균 수익"
                  value={`${result.avgWin > 1000 ? '₩' : '$'}${Math.abs(result.avgWin).toLocaleString()}`}
                  highlight="green"
                />
                <StatRow
                  label="평균 손실"
                  value={`${Math.abs(result.avgLoss) > 1000 ? '₩' : '$'}${Math.abs(result.avgLoss).toLocaleString()}`}
                  highlight="red"
                />
                <StatRow
                  label="최대 연승"
                  value={`${result.maxConsecutiveWins}연속`}
                />
                <StatRow
                  label="최대 연패"
                  value={`${result.maxConsecutiveLosses}연속`}
                />
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <h3 className="font-bold mb-3">📋 거래 내역</h3>
              <div className="max-h-64 overflow-y-auto text-sm">
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left">날짜</th>
                      <th className="px-2 py-1">유형</th>
                      <th className="px-2 py-1 text-right">가격</th>
                      <th className="px-2 py-1 text-right">손익</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.map((t, i) => (
                      <tr key={i} className="border-b">
                        <td className="px-2 py-1.5 text-gray-500">{t.time}</td>
                        <td className="px-2 py-1.5 text-center">
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs font-bold ${t.side === 'BUY' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}
                          >
                            {t.side === 'BUY' ? '매수' : '매도'}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono">
                          {t.price > 1000
                            ? `₩${t.price.toLocaleString()}`
                            : `$${t.price}`}
                        </td>
                        <td
                          className={`px-2 py-1.5 text-right font-bold ${t.pnl > 0 ? 'text-red-500' : t.pnl < 0 ? 'text-blue-500' : 'text-gray-400'}`}
                        >
                          {t.pnl !== 0
                            ? (t.pnl > 0 ? '+' : '') +
                              (Math.abs(t.pnl) > 1000
                                ? `₩${t.pnl.toLocaleString()}`
                                : `$${t.pnl}`)
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
            ⚠️ 백테스트 결과는 과거 데이터 기반이며 미래 수익을 보장하지
            않습니다. 실제 거래 시 슬리피지, 수수료 등으로 결과가 다를 수
            있습니다.
          </div>
        </>
      )}

      {!result && (
        <div className="rounded-xl border bg-white p-12 text-center">
          <p className="text-5xl">🧪</p>
          <p className="mt-3 text-lg font-medium text-gray-600">
            전략과 종목을 선택한 후 백테스트를 실행하세요
          </p>
          <p className="mt-1 text-sm text-gray-400">
            과거 데이터로 전략의 수익성을 검증합니다
          </p>
        </div>
      )}
    </div>
  )
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  const colors: Record<string, string> = {
    red: 'text-red-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    gray: 'text-gray-800',
  }
  return (
    <div className="rounded-xl border bg-white p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-xl font-black ${colors[color]}`}>{value}</p>
    </div>
  )
}

function StatRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: string
}) {
  return (
    <div className="flex justify-between border-b border-gray-100 py-1.5">
      <span className="text-gray-600">{label}</span>
      <span
        className={`font-bold ${highlight === 'green' ? 'text-green-600' : highlight === 'red' ? 'text-red-500' : ''}`}
      >
        {value}
      </span>
    </div>
  )
}
