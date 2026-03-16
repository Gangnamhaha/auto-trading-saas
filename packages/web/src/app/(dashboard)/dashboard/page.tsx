'use client'

import { useEffect, useState } from 'react'

// ═══ 실시간 시뮬레이션 데이터 ═══
function useRealtimeData() {
  const [data, setData] = useState({
    totalAssets: 10450000,
    todayPnl: 125000,
    todayPnlPct: 1.2,
    totalReturn: 4.5,
    activeStrategies: 2,
    positions: [
      {
        symbol: '005930',
        name: '삼성전자',
        qty: 15,
        avgPrice: 70500,
        currentPrice: 72500,
        pnl: 30000,
        pnlPct: 2.84,
        weight: 32,
      },
      {
        symbol: '000660',
        name: 'SK하이닉스',
        qty: 5,
        avgPrice: 178000,
        currentPrice: 185000,
        pnl: 35000,
        pnlPct: 3.93,
        weight: 28,
      },
      {
        symbol: 'AAPL',
        name: 'Apple',
        qty: 8,
        avgPrice: 192.5,
        currentPrice: 198.5,
        pnl: 48,
        pnlPct: 3.12,
        weight: 15,
      },
      {
        symbol: '035420',
        name: 'NAVER',
        qty: 3,
        avgPrice: 210000,
        currentPrice: 215000,
        pnl: 15000,
        pnlPct: 2.38,
        weight: 12,
      },
      {
        symbol: 'NVDA',
        name: 'NVIDIA',
        qty: 2,
        avgPrice: 850,
        currentPrice: 875.3,
        pnl: 50.6,
        pnlPct: 2.98,
        weight: 8,
      },
      {
        symbol: '035720',
        name: '카카오',
        qty: 10,
        avgPrice: 47000,
        currentPrice: 45800,
        pnl: -12000,
        pnlPct: -2.55,
        weight: 5,
      },
    ],
    alerts: [
      {
        id: 1,
        type: 'trade',
        msg: '🟢 삼성전자 5주 매수 체결 @ ₩72,500',
        time: '2분 전',
      },
      {
        id: 2,
        type: 'signal',
        msg: '📊 SK하이닉스 골든크로스 발생!',
        time: '15분 전',
      },
      {
        id: 3,
        type: 'risk',
        msg: '⚠️ 카카오 손절 라인(-3%) 근접',
        time: '32분 전',
      },
      {
        id: 4,
        type: 'trade',
        msg: '🔴 NAVER 2주 매도 @ ₩215,000 (+2.4%)',
        time: '1시간 전',
      },
      {
        id: 5,
        type: 'system',
        msg: '✅ 데몬 정상 가동 중 (업타임 72시간)',
        time: '3시간 전',
      },
    ],
    recentTrades: [
      {
        date: '03-16 09:15',
        symbol: '삼성전자',
        side: 'buy',
        qty: 5,
        price: 72500,
        pnl: null,
      },
      {
        date: '03-16 09:02',
        symbol: 'SK하이닉스',
        side: 'buy',
        qty: 2,
        price: 185000,
        pnl: null,
      },
      {
        date: '03-15 14:45',
        symbol: 'NAVER',
        side: 'sell',
        qty: 2,
        price: 215000,
        pnl: 10000,
      },
      {
        date: '03-15 10:30',
        symbol: 'Apple',
        side: 'buy',
        qty: 3,
        price: 198.5,
        pnl: null,
      },
      {
        date: '03-14 13:20',
        symbol: '카카오',
        side: 'buy',
        qty: 10,
        price: 47000,
        pnl: null,
      },
    ],
  })

  // 실시간 가격 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        const newPositions = prev.positions.map((p) => {
          const change = (Math.random() - 0.48) * p.currentPrice * 0.002
          const newPrice = Math.round((p.currentPrice + change) * 100) / 100
          const newPnl = (newPrice - p.avgPrice) * p.qty
          return {
            ...p,
            currentPrice: newPrice,
            pnl: Math.round(newPnl),
            pnlPct: ((newPrice - p.avgPrice) / p.avgPrice) * 100,
          }
        })
        const totalPnl = newPositions.reduce((s, p) => s + p.pnl, 0)
        return {
          ...prev,
          positions: newPositions,
          todayPnl: Math.round(totalPnl),
          todayPnlPct: (totalPnl / prev.totalAssets) * 100,
          totalAssets: 10000000 + totalPnl,
        }
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return data
}

export default function DashboardPage() {
  const data = useRealtimeData()
  const [selectedView, setSelectedView] = useState<
    'positions' | 'trades' | 'alerts'
  >('positions')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">대시보드</h1>
          <p className="text-gray-500">실시간 포트폴리오 현황</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <span className="text-sm text-green-600 font-medium">LIVE</span>
        </div>
      </div>

      {/* ═══ 실시간 요약 카드 4개 ═══ */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">총 자산</p>
          <p className="mt-1 text-2xl font-black tabular-nums transition-all duration-500">
            ₩{data.totalAssets.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">KIS + Alpaca 연동</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">오늘 손익</p>
          <p
            className={`mt-1 text-2xl font-black tabular-nums transition-all duration-500 ${data.todayPnl >= 0 ? 'text-red-500' : 'text-blue-500'}`}
          >
            {data.todayPnl >= 0 ? '+' : ''}₩{data.todayPnl.toLocaleString()}
          </p>
          <p
            className={`text-xs ${data.todayPnlPct >= 0 ? 'text-red-400' : 'text-blue-400'}`}
          >
            {data.todayPnlPct >= 0 ? '+' : ''}
            {data.todayPnlPct.toFixed(2)}%
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">총 수익률</p>
          <p className="mt-1 text-2xl font-black text-red-500">
            +{data.totalReturn}%
          </p>
          <p className="text-xs text-gray-400">지난 30일</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">활성 전략</p>
          <p className="mt-1 text-2xl font-black">{data.activeStrategies}</p>
          <p className="text-xs text-gray-400">MA + RSI 실행 중</p>
        </div>
      </div>

      {/* ═══ 포지션 히트맵 ═══ */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h3 className="font-bold mb-3">📊 포지션 히트맵</h3>
        <div
          className="grid grid-cols-6 gap-1.5"
          style={{
            gridTemplateColumns: data.positions
              .map((p) => `${p.weight}fr`)
              .join(' '),
          }}
        >
          {data.positions.map((p) => (
            <div
              key={p.symbol}
              className={`rounded-lg p-3 text-white text-center transition-all duration-1000 ${
                p.pnlPct >= 2
                  ? 'bg-red-500'
                  : p.pnlPct >= 0
                    ? 'bg-red-400'
                    : p.pnlPct >= -2
                      ? 'bg-blue-400'
                      : 'bg-blue-500'
              }`}
              style={{ minHeight: '80px' }}
            >
              <p className="font-bold text-sm">{p.name}</p>
              <p className="text-lg font-black tabular-nums">
                {p.pnlPct >= 0 ? '+' : ''}
                {p.pnlPct.toFixed(1)}%
              </p>
              <p className="text-xs opacity-80">{p.qty}주</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ 탭: 포지션 / 거래 / 알림 ═══ */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="flex border-b">
          {(['positions', 'trades', 'alerts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedView(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${selectedView === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
            >
              {tab === 'positions'
                ? `📈 보유종목 (${data.positions.length})`
                : tab === 'trades'
                  ? `📋 최근거래 (${data.recentTrades.length})`
                  : `🔔 알림 (${data.alerts.length})`}
            </button>
          ))}
        </div>

        {/* 보유종목 */}
        {selectedView === 'positions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">종목</th>
                  <th className="px-4 py-3 text-right">현재가</th>
                  <th className="px-4 py-3 text-right">수량</th>
                  <th className="px-4 py-3 text-right">평균가</th>
                  <th className="px-4 py-3 text-right">손익</th>
                  <th className="px-4 py-3 text-right">수익률</th>
                  <th className="px-4 py-3 text-right">비중</th>
                </tr>
              </thead>
              <tbody>
                {data.positions.map((p) => (
                  <tr
                    key={p.symbol}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-bold">{p.name}</span>{' '}
                      <span className="text-gray-400 text-xs">{p.symbol}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums transition-all duration-500">
                      {typeof p.currentPrice === 'number' &&
                      p.currentPrice > 1000
                        ? `₩${p.currentPrice.toLocaleString()}`
                        : `$${p.currentPrice}`}
                    </td>
                    <td className="px-4 py-3 text-right">{p.qty}주</td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {typeof p.avgPrice === 'number' && p.avgPrice > 1000
                        ? `₩${p.avgPrice.toLocaleString()}`
                        : `$${p.avgPrice}`}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold tabular-nums transition-all duration-500 ${p.pnl >= 0 ? 'text-red-500' : 'text-blue-500'}`}
                    >
                      {p.pnl >= 0 ? '+' : ''}
                      {typeof p.pnl === 'number' && Math.abs(p.pnl) > 1000
                        ? `₩${p.pnl.toLocaleString()}`
                        : `$${p.pnl}`}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold tabular-nums transition-all duration-500 ${p.pnlPct >= 0 ? 'text-red-500' : 'text-blue-500'}`}
                    >
                      {p.pnlPct >= 0 ? '+' : ''}
                      {p.pnlPct.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-gray-100">
                          <div
                            className="h-1.5 rounded-full bg-blue-500"
                            style={{ width: `${p.weight}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {p.weight}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 최근거래 */}
        {selectedView === 'trades' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">시간</th>
                  <th className="px-4 py-3 text-left">종목</th>
                  <th className="px-4 py-3 text-center">유형</th>
                  <th className="px-4 py-3 text-right">수량</th>
                  <th className="px-4 py-3 text-right">가격</th>
                  <th className="px-4 py-3 text-right">손익</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTrades.map((t, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{t.date}</td>
                    <td className="px-4 py-3 font-medium">{t.symbol}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-bold ${t.side === 'buy' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}
                      >
                        {t.side === 'buy' ? '매수' : '매도'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{t.qty}주</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {typeof t.price === 'number' && t.price > 1000
                        ? `₩${t.price.toLocaleString()}`
                        : `$${t.price}`}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {t.pnl !== null ? (
                        <span
                          className={
                            t.pnl >= 0
                              ? 'text-red-500 font-bold'
                              : 'text-blue-500 font-bold'
                          }
                        >
                          +₩{t.pnl.toLocaleString()}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 알림 */}
        {selectedView === 'alerts' && (
          <div className="divide-y">
            {data.alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <span className="text-sm">{alert.msg}</span>
                <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                  {alert.time}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
        ⚠️ 투자 원금 손실이 발생할 수 있습니다. 과거 수익률이 미래 수익을
        보장하지 않습니다. 본 서비스는 투자자문이 아닌 기술적 자동주문
        도구입니다.
      </div>
    </div>
  )
}
