'use client'

import { useState } from 'react'

const PERIODS = [
  { id: '1w', label: '1주' },
  { id: '1m', label: '1개월' },
  { id: '3m', label: '3개월' },
  { id: '6m', label: '6개월' },
  { id: '1y', label: '1년' },
]

const DAILY_PNL = Array.from({ length: 30 }, (_, i) => ({
  date: `03-${String(i + 1).padStart(2, '0')}`,
  pnl: Math.round((Math.random() - 0.38) * 150000),
  cumulative: 0,
}))
DAILY_PNL.reduce((acc, d) => {
  d.cumulative = acc + d.pnl
  return d.cumulative
}, 0)

const STRATEGY_PERF = [
  {
    name: 'Profit Maximizer',
    returnPct: 8.7,
    winRate: 68,
    trades: 45,
    sharpe: 1.9,
    mdd: -4.2,
    color: 'bg-red-500',
  },
  {
    name: 'Ultra Alpha',
    returnPct: 6.3,
    winRate: 62,
    trades: 38,
    sharpe: 1.5,
    mdd: -5.8,
    color: 'bg-orange-500',
  },
  {
    name: 'AI 분석',
    returnPct: 5.1,
    winRate: 59,
    trades: 22,
    sharpe: 1.3,
    mdd: -6.1,
    color: 'bg-purple-500',
  },
  {
    name: 'MA 크로스오버',
    returnPct: 3.8,
    winRate: 55,
    trades: 31,
    sharpe: 1.1,
    mdd: -7.3,
    color: 'bg-blue-500',
  },
  {
    name: 'RSI',
    returnPct: 2.9,
    winRate: 53,
    trades: 28,
    sharpe: 0.9,
    mdd: -8.5,
    color: 'bg-green-500',
  },
  {
    name: 'MACD',
    returnPct: 4.2,
    winRate: 57,
    trades: 35,
    sharpe: 1.2,
    mdd: -6.8,
    color: 'bg-cyan-500',
  },
]

const MONTHLY = [
  { month: '2025-10', pnl: 320000, pct: 3.2 },
  { month: '2025-11', pnl: -180000, pct: -1.7 },
  { month: '2025-12', pnl: 450000, pct: 4.3 },
  { month: '2026-01', pnl: 520000, pct: 4.8 },
  { month: '2026-02', pnl: 380000, pct: 3.4 },
  { month: '2026-03', pnl: 650000, pct: 5.6 },
]

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('1m')

  const totalReturn = DAILY_PNL[DAILY_PNL.length - 1].cumulative
  const winDays = DAILY_PNL.filter((d) => d.pnl > 0).length
  const lossDays = DAILY_PNL.filter((d) => d.pnl < 0).length
  const bestDay = Math.max(...DAILY_PNL.map((d) => d.pnl))
  const worstDay = Math.min(...DAILY_PNL.map((d) => d.pnl))
  const maxPnl = Math.max(...DAILY_PNL.map((d) => Math.abs(d.pnl)), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">📊 수익률 분석</h1>
        <p className="text-gray-500">
          일별/주별/월별 수익 분석 + 전략별 성과 비교
        </p>
      </div>

      {/* 기간 선택 */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${period === p.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">총 수익</p>
          <p
            className={`mt-1 text-xl font-black ${totalReturn >= 0 ? 'text-red-500' : 'text-blue-500'}`}
          >
            {totalReturn >= 0 ? '+' : ''}₩{totalReturn.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">승/패일</p>
          <p className="mt-1 text-xl font-black">
            <span className="text-red-500">{winDays}</span>/
            <span className="text-blue-500">{lossDays}</span>
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">최고일 수익</p>
          <p className="mt-1 text-xl font-black text-red-500">
            +₩{bestDay.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">최악일 손실</p>
          <p className="mt-1 text-xl font-black text-blue-500">
            ₩{worstDay.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">승률</p>
          <p className="mt-1 text-xl font-black">
            {((winDays / (winDays + lossDays)) * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* 일별 P&L 바 차트 */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-bold mb-4">📅 일별 손익 (최근 30일)</h3>
        <div className="flex items-end gap-1" style={{ height: '200px' }}>
          {DAILY_PNL.map((d, i) => {
            const height = (Math.abs(d.pnl) / maxPnl) * 100
            return (
              <div
                key={i}
                className="group relative flex-1 flex flex-col justify-end items-center"
              >
                <div className="absolute -top-8 hidden group-hover:block rounded bg-gray-800 px-2 py-1 text-xs text-white whitespace-nowrap z-10">
                  {d.date}: {d.pnl >= 0 ? '+' : ''}₩{d.pnl.toLocaleString()}
                </div>
                <div
                  className={`w-full rounded-t transition-all hover:opacity-80 ${d.pnl >= 0 ? 'bg-red-400' : 'bg-blue-400'}`}
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
              </div>
            )
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>{DAILY_PNL[0].date}</span>
          <span>{DAILY_PNL[DAILY_PNL.length - 1].date}</span>
        </div>
      </div>

      {/* 전략별 성과 비교 */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-bold mb-4">🏆 전략별 성과 비교</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">전략</th>
                <th className="px-4 py-3 text-right">수익률</th>
                <th className="px-4 py-3 text-right">승률</th>
                <th className="px-4 py-3 text-right">거래</th>
                <th className="px-4 py-3 text-right">샤프비율</th>
                <th className="px-4 py-3 text-right">MDD</th>
                <th className="px-4 py-3">성과 바</th>
              </tr>
            </thead>
            <tbody>
              {STRATEGY_PERF.sort((a, b) => b.returnPct - a.returnPct).map(
                (s, i) => (
                  <tr key={s.name} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {i === 0 && <span>🥇</span>}
                        {i === 1 && <span>🥈</span>}
                        {i === 2 && <span>🥉</span>}
                        <span className="font-medium">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-500">
                      +{s.returnPct}%
                    </td>
                    <td className="px-4 py-3 text-right">{s.winRate}%</td>
                    <td className="px-4 py-3 text-right">{s.trades}건</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {s.sharpe}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-500">
                      {s.mdd}%
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div
                          className={`h-2 rounded-full ${s.color}`}
                          style={{ width: `${(s.returnPct / 10) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 월별 수익 */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-bold mb-4">📈 월별 수익 추이</h3>
        <div className="grid grid-cols-6 gap-3">
          {MONTHLY.map((m) => (
            <div
              key={m.month}
              className={`rounded-lg p-3 text-center ${m.pnl >= 0 ? 'bg-red-50' : 'bg-blue-50'}`}
            >
              <p className="text-xs text-gray-500">{m.month}</p>
              <p
                className={`text-lg font-black ${m.pnl >= 0 ? 'text-red-500' : 'text-blue-500'}`}
              >
                {m.pct >= 0 ? '+' : ''}
                {m.pct}%
              </p>
              <p className="text-xs text-gray-400">
                {m.pnl >= 0 ? '+' : ''}₩{m.pnl.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
        ⚠️ 과거 수익률은 미래를 보장하지 않습니다. 투자 원금 손실이 발생할 수
        있습니다.
      </div>
    </div>
  )
}
