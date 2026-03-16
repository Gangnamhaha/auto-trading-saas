'use client'

import { useState } from 'react'

interface User {
  id: string
  email: string
  tier: 'free' | 'basic' | 'pro'
  status: 'active' | 'suspended'
  strategies: number
  trades: number
  joinedAt: string
  lastActiveAt: string
}

const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'kim@example.com',
    tier: 'pro',
    status: 'active',
    strategies: 4,
    trades: 156,
    joinedAt: '2026-01-15',
    lastActiveAt: '2026-03-16',
  },
  {
    id: '2',
    email: 'lee@example.com',
    tier: 'basic',
    status: 'active',
    strategies: 2,
    trades: 89,
    joinedAt: '2026-02-01',
    lastActiveAt: '2026-03-15',
  },
  {
    id: '3',
    email: 'park@example.com',
    tier: 'free',
    status: 'active',
    strategies: 1,
    trades: 23,
    joinedAt: '2026-02-10',
    lastActiveAt: '2026-03-14',
  },
  {
    id: '4',
    email: 'choi@example.com',
    tier: 'basic',
    status: 'active',
    strategies: 2,
    trades: 67,
    joinedAt: '2026-02-20',
    lastActiveAt: '2026-03-16',
  },
  {
    id: '5',
    email: 'jung@example.com',
    tier: 'pro',
    status: 'active',
    strategies: 5,
    trades: 234,
    joinedAt: '2026-01-20',
    lastActiveAt: '2026-03-16',
  },
  {
    id: '6',
    email: 'kang@example.com',
    tier: 'free',
    status: 'suspended',
    strategies: 0,
    trades: 5,
    joinedAt: '2026-03-01',
    lastActiveAt: '2026-03-05',
  },
  {
    id: '7',
    email: 'yoon@example.com',
    tier: 'basic',
    status: 'active',
    strategies: 2,
    trades: 45,
    joinedAt: '2026-02-15',
    lastActiveAt: '2026-03-13',
  },
  {
    id: '8',
    email: 'shin@example.com',
    tier: 'pro',
    status: 'active',
    strategies: 6,
    trades: 312,
    joinedAt: '2026-01-10',
    lastActiveAt: '2026-03-16',
  },
]

const TIER_COLORS = {
  free: 'bg-gray-100 text-gray-700',
  basic: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
}
const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
}

export default function AdminPage() {
  const [tab, setTab] = useState<'overview' | 'users' | 'system'>('overview')

  const totalUsers = MOCK_USERS.length
  const paidUsers = MOCK_USERS.filter((u) => u.tier !== 'free').length
  const monthlyRevenue = MOCK_USERS.reduce(
    (sum, u) =>
      sum + (u.tier === 'pro' ? 29900 : u.tier === 'basic' ? 9900 : 0),
    0
  )
  const totalTrades = MOCK_USERS.reduce((sum, u) => sum + u.trades, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🛡️ 관리자 대시보드</h1>
        <p className="text-gray-500">사용자, 매출, 시스템 현황을 관리합니다</p>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 border-b">
        {(['overview', 'users', 'system'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'overview'
              ? '📊 개요'
              : t === 'users'
                ? '👥 사용자'
                : '⚙️ 시스템'}
          </button>
        ))}
      </div>

      {/* 개요 탭 */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              title="총 사용자"
              value={totalUsers.toLocaleString()}
              sub="이번 달 +3"
              color="blue"
            />
            <StatCard
              title="유료 사용자"
              value={paidUsers.toLocaleString()}
              sub={`전환율 ${((paidUsers / totalUsers) * 100).toFixed(0)}%`}
              color="green"
            />
            <StatCard
              title="월 매출"
              value={`₩${monthlyRevenue.toLocaleString()}`}
              sub="MRR"
              color="purple"
            />
            <StatCard
              title="총 거래"
              value={totalTrades.toLocaleString()}
              sub="이번 달"
              color="amber"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border bg-white p-4">
              <h3 className="mb-3 font-semibold">📈 티어별 분포</h3>
              <div className="space-y-3">
                {['free', 'basic', 'pro'].map((tier) => {
                  const count = MOCK_USERS.filter((u) => u.tier === tier).length
                  const pct = ((count / totalUsers) * 100).toFixed(0)
                  return (
                    <div key={tier} className="flex items-center gap-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${TIER_COLORS[tier as keyof typeof TIER_COLORS]}`}
                      >
                        {tier.toUpperCase()}
                      </span>
                      <div className="flex-1 rounded-full bg-gray-100 h-2">
                        <div
                          className="rounded-full bg-blue-500 h-2"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {count}명 ({pct}%)
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <h3 className="mb-3 font-semibold">🔔 최근 알림</h3>
              <div className="space-y-2 text-sm">
                <AlertItem
                  time="5분 전"
                  text="shin@example.com이 Pro 플랜으로 업그레이드"
                  type="success"
                />
                <AlertItem
                  time="1시간 전"
                  text="kang@example.com 계정 정지 (결제 실패)"
                  type="error"
                />
                <AlertItem
                  time="3시간 전"
                  text="새 사용자 가입: yoon@example.com"
                  type="info"
                />
                <AlertItem
                  time="6시간 전"
                  text="일일 거래 1,000건 돌파"
                  type="success"
                />
                <AlertItem
                  time="어제"
                  text="시스템 업데이트 완료 v0.2.0"
                  type="info"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 사용자 탭 */}
      {tab === 'users' && (
        <div className="rounded-lg border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    이메일
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    플랜
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    상태
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    전략
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    거래
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    가입일
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    최근 활동
                  </th>
                </tr>
              </thead>
              <tbody>
                {MOCK_USERS.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${TIER_COLORS[user.tier]}`}
                      >
                        {user.tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[user.status]}`}
                      >
                        {user.status === 'active' ? '활성' : '정지'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{user.strategies}개</td>
                    <td className="px-4 py-3">{user.trades}건</td>
                    <td className="px-4 py-3 text-gray-500">{user.joinedAt}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {user.lastActiveAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 시스템 탭 */}
      {tab === 'system' && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-white p-4">
            <h3 className="mb-3 font-semibold">🖥️ 서버 상태</h3>
            <div className="space-y-3">
              <SystemRow
                label="웹 서버"
                status="running"
                detail="Vercel (ICN1)"
              />
              <SystemRow
                label="트레이딩 엔진"
                status="running"
                detail="Docker (ECS)"
              />
              <SystemRow
                label="PostgreSQL"
                status="running"
                detail="RDS ap-northeast-2"
              />
              <SystemRow label="Redis" status="running" detail="ElastiCache" />
              <SystemRow
                label="KIS WebSocket"
                status="connected"
                detail="실시간 데이터 수신 중"
              />
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <h3 className="mb-3 font-semibold">📊 시스템 지표</h3>
            <div className="space-y-3">
              <MetricRow label="CPU 사용률" value="23%" />
              <MetricRow label="메모리 사용률" value="45%" />
              <MetricRow label="API 응답시간 (p95)" value="120ms" />
              <MetricRow label="업타임" value="99.97%" />
              <MetricRow label="일일 API 호출" value="12,345" />
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 md:col-span-2">
            <h3 className="mb-3 font-semibold">🔧 빠른 작업</h3>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                캐시 초기화
              </button>
              <button className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700">
                데이터베이스 백업
              </button>
              <button className="rounded-lg bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-700">
                엔진 재시작
              </button>
              <button className="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700">
                공지사항 전송
              </button>
              <button className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">
                긴급 정지
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  sub,
  color,
}: {
  title: string
  value: string
  sub: string
  color: string
}) {
  const colors: Record<string, string> = {
    blue: 'border-l-blue-500',
    green: 'border-l-green-500',
    purple: 'border-l-purple-500',
    amber: 'border-l-amber-500',
  }
  return (
    <div
      className={`rounded-lg border border-l-4 ${colors[color]} bg-white p-4`}
    >
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{sub}</p>
    </div>
  )
}

function AlertItem({
  time,
  text,
  type,
}: {
  time: string
  text: string
  type: 'success' | 'error' | 'info'
}) {
  const icons = { success: '✅', error: '🚨', info: 'ℹ️' }
  return (
    <div className="flex gap-2 rounded-lg bg-gray-50 p-2">
      <span>{icons[type]}</span>
      <div className="flex-1">
        <p>{text}</p>
        <p className="text-xs text-gray-400">{time}</p>
      </div>
    </div>
  )
}

function SystemRow({
  label,
  detail,
}: {
  label: string
  status: string
  detail: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
        <span className="text-sm text-gray-500">{detail}</span>
      </div>
    </div>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="font-mono font-medium">{value}</span>
    </div>
  )
}
