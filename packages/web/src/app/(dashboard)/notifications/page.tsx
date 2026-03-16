'use client'

import { useState } from 'react'

interface Alert {
  id: number
  type: 'trade' | 'risk' | 'system' | 'signal' | 'rebalance'
  title: string
  message: string
  time: string
  read: boolean
}

const MOCK_ALERTS: Alert[] = [
  {
    id: 1,
    type: 'trade',
    title: '🟢 매수 체결',
    message: 'SK하이닉스 5주 @ ₩185,000 (Autopilot)',
    time: '2분 전',
    read: false,
  },
  {
    id: 2,
    type: 'signal',
    title: '📊 골든크로스',
    message: '삼성전자 5MA↑20MA 상향돌파 — 매수 신호',
    time: '8분 전',
    read: false,
  },
  {
    id: 3,
    type: 'risk',
    title: '⚠️ 손절 근접',
    message: '카카오 -2.5% (손절라인 -3%)',
    time: '15분 전',
    read: false,
  },
  {
    id: 4,
    type: 'trade',
    title: '🔴 매도 체결',
    message: 'NAVER 3주 @ ₩215,000 (+2.4% 수익)',
    time: '32분 전',
    read: true,
  },
  {
    id: 5,
    type: 'rebalance',
    title: '📊 리밸런싱',
    message: '포트폴리오 편차 5.2% 초과 → 자동 조정 실행',
    time: '1시간 전',
    read: true,
  },
  {
    id: 6,
    type: 'system',
    title: '🛩️ Autopilot',
    message: '전략 전환: 상승추세 → Ultra Alpha (공격적)',
    time: '1시간 전',
    read: true,
  },
  {
    id: 7,
    type: 'trade',
    title: '🟢 매수 체결',
    message: 'Apple 3주 @ $198.50 (AI 전략)',
    time: '2시간 전',
    read: true,
  },
  {
    id: 8,
    type: 'risk',
    title: '🚨 회로차단기',
    message: '일일 손실 -4.8% — 추가 매매 제한 (5% 한도)',
    time: '어제',
    read: true,
  },
  {
    id: 9,
    type: 'signal',
    title: '🎯 종목 추천',
    message: 'NVIDIA S등급 (94점) — 강력 매수 관심',
    time: '어제',
    read: true,
  },
  {
    id: 10,
    type: 'system',
    title: '✅ 일일 리포트',
    message: '오늘 수익: +₩125,000 (+1.2%) | 거래 12건 | 승률 67%',
    time: '어제',
    read: true,
  },
]

const TYPE_ICONS: Record<string, string> = {
  trade: '💰',
  risk: '🛡️',
  system: '⚙️',
  signal: '📊',
  rebalance: '📐',
}
const TYPE_LABELS: Record<string, string> = {
  trade: '매매',
  risk: '리스크',
  system: '시스템',
  signal: '시그널',
  rebalance: '리밸런싱',
}
const TYPE_COLORS: Record<string, string> = {
  trade: 'border-l-green-500',
  risk: 'border-l-red-500',
  system: 'border-l-blue-500',
  signal: 'border-l-purple-500',
  rebalance: 'border-l-amber-500',
}

export default function NotificationsPage() {
  const [alerts, setAlerts] = useState(MOCK_ALERTS)
  const [filter, setFilter] = useState<string>('all')

  const unreadCount = alerts.filter((a) => !a.read).length
  const filtered =
    filter === 'all' ? alerts : alerts.filter((a) => a.type === filter)

  const markAllRead = () => setAlerts(alerts.map((a) => ({ ...a, read: true })))
  const markRead = (id: number) =>
    setAlerts(alerts.map((a) => (a.id === id ? { ...a, read: true } : a)))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🔔 알림 센터</h1>
          <p className="text-gray-500">매매 · 리스크 · 시그널 · 시스템 알림</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white">
              {unreadCount} 새 알림
            </span>
          )}
          <button
            onClick={markAllRead}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            모두 읽음
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 flex-wrap">
        {[
          ['all', '전체'],
          ['trade', '💰 매매'],
          ['risk', '🛡️ 리스크'],
          ['signal', '📊 시그널'],
          ['system', '⚙️ 시스템'],
          ['rebalance', '📐 리밸런싱'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-lg px-3 py-1.5 text-sm ${filter === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 알림 목록 */}
      <div className="space-y-2">
        {filtered.map((alert) => (
          <div
            key={alert.id}
            onClick={() => markRead(alert.id)}
            className={`rounded-xl border-l-4 bg-white p-4 shadow-sm transition-all hover:shadow-md cursor-pointer ${TYPE_COLORS[alert.type]} ${!alert.read ? 'bg-blue-50/50' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{TYPE_ICONS[alert.type]}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{alert.title}</span>
                    {!alert.read && (
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-gray-600">
                    {alert.message}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400">{alert.time}</span>
                <p className="mt-1">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs ${
                      alert.type === 'trade'
                        ? 'bg-green-100 text-green-700'
                        : alert.type === 'risk'
                          ? 'bg-red-100 text-red-700'
                          : alert.type === 'signal'
                            ? 'bg-purple-100 text-purple-700'
                            : alert.type === 'rebalance'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {TYPE_LABELS[alert.type]}
                  </span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
