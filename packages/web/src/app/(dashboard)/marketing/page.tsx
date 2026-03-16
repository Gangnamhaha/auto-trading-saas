'use client'

import { useState } from 'react'

interface MarketingTask {
  id: string
  type: string
  schedule: string
  status: string
  lastRunAt: string
  nextRunAt: string
  description: string
}

const MOCK_TASKS: MarketingTask[] = [
  {
    id: 'weekly-blog',
    type: 'blog',
    schedule: '매주 월요일 09:00',
    status: 'completed',
    lastRunAt: '2026-03-11 09:00',
    nextRunAt: '2026-03-18 09:00',
    description: '주간 시장 리뷰 블로그 자동 작성',
  },
  {
    id: 'daily-sns',
    type: 'sns',
    schedule: '매일 18:00',
    status: 'pending',
    lastRunAt: '2026-03-15 18:00',
    nextRunAt: '2026-03-16 18:00',
    description: 'SNS 포스트 자동 생성',
  },
  {
    id: 'weekly-newsletter',
    type: 'newsletter',
    schedule: '매주 금요일 17:00',
    status: 'completed',
    lastRunAt: '2026-03-14 17:00',
    nextRunAt: '2026-03-21 17:00',
    description: '주간 뉴스레터 자동 발송',
  },
  {
    id: 'daily-report',
    type: 'report',
    schedule: '매일 09:30',
    status: 'completed',
    lastRunAt: '2026-03-16 09:30',
    nextRunAt: '2026-03-17 09:30',
    description: '일일 전략 성과 리포트',
  },
]

const TYPE_ICONS: Record<string, string> = {
  blog: '📝',
  sns: '📱',
  newsletter: '📧',
  report: '📊',
}
const TYPE_LABELS: Record<string, string> = {
  blog: '블로그',
  sns: 'SNS',
  newsletter: '뉴스레터',
  report: '리포트',
}
const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  running: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
}
const STATUS_LABELS: Record<string, string> = {
  completed: '완료',
  pending: '대기',
  running: '실행중',
  failed: '실패',
}

export default function MarketingPage() {
  const [tasks] = useState(MOCK_TASKS)
  const [runningTask, setRunningTask] = useState<string | null>(null)

  const handleRunNow = (taskId: string) => {
    setRunningTask(taskId)
    setTimeout(() => setRunningTask(null), 2000)
  }

  const completedToday = tasks.filter((t) => t.status === 'completed').length
  const pendingCount = tasks.filter((t) => t.status === 'pending').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🤖 마케팅 자동화</h1>
        <p className="text-gray-500">
          AI가 블로그, SNS, 뉴스레터를 자동으로 생성합니다
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">자동화 작업</p>
          <p className="mt-1 text-2xl font-bold">{tasks.length}개</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">오늘 완료</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {completedToday}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">대기 중</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {pendingCount}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">AI 모델</p>
          <p className="mt-1 text-2xl font-bold">GPT-4o</p>
        </div>
      </div>

      {/* 작업 목록 */}
      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="rounded-xl border bg-white p-5 transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <span className="text-3xl">
                  {TYPE_ICONS[task.type] ?? '📋'}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{task.description}</h3>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[task.status] ?? ''}`}
                    >
                      {STATUS_LABELS[task.status] ?? task.status}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-4 text-sm text-gray-500">
                    <span>📋 {TYPE_LABELS[task.type] ?? task.type}</span>
                    <span>🕐 {task.schedule}</span>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-gray-400">
                    <span>마지막 실행: {task.lastRunAt}</span>
                    <span>다음 실행: {task.nextRunAt}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRunNow(task.id)}
                disabled={runningTask === task.id}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  runningTask === task.id
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {runningTask === task.id ? '✓ 실행 완료!' : '지금 실행'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* AI 콘텐츠 미리보기 */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-bold">📄 최근 생성된 콘텐츠 미리보기</h3>
        <div className="mt-4 rounded-lg bg-gray-50 p-4">
          <h4 className="font-semibold">📝 주간 시장 리뷰 (2026.03.11)</h4>
          <p className="mt-2 text-sm text-gray-600">
            이번 주 KOSPI는 +1.2% 상승하며 2,650선을 유지했습니다. 반도체 업종이
            강세를 보이며 삼성전자(+2.5%), SK하이닉스(+3.1%)가 시장을
            견인했습니다. AutoTrade KR의 MA 크로스오버 전략은 이번 주 +1.2%의
            수익률을 기록했습니다...
          </p>
          <p className="mt-2 text-xs text-amber-600">
            ⚠️ 과거 수익률이 미래 수익을 보장하지 않습니다.
          </p>
        </div>
      </div>
    </div>
  )
}
