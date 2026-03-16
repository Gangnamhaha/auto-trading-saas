'use client'

import { useEffect, useState } from 'react'

type State = 'off' | 'scanning' | 'trading' | 'paused' | 'emergency_stop'
type Regime = 'trending_up' | 'trending_down' | 'ranging' | 'volatile' | 'crash'

const REGIME_LABELS: Record<
  Regime,
  { label: string; icon: string; color: string; strategy: string }
> = {
  trending_up: {
    label: '상승 추세',
    icon: '📈',
    color: 'text-red-500',
    strategy: 'Ultra Alpha (공격적)',
  },
  trending_down: {
    label: '하락 추세',
    icon: '📉',
    color: 'text-blue-500',
    strategy: 'Profit Maximizer (보수적)',
  },
  ranging: {
    label: '박스권',
    icon: '↔️',
    color: 'text-gray-500',
    strategy: 'Profit Maximizer (균형)',
  },
  volatile: {
    label: '고변동성',
    icon: '⚡',
    color: 'text-amber-500',
    strategy: 'AI 분석 (균형)',
  },
  crash: {
    label: '폭락',
    icon: '🚨',
    color: 'text-red-700',
    strategy: 'Ultra Alpha (보수적)',
  },
}

const STATE_STYLES: Record<
  State,
  { label: string; color: string; pulse: boolean }
> = {
  off: { label: 'OFF', color: 'bg-gray-500', pulse: false },
  scanning: { label: '스캐닝', color: 'bg-blue-500', pulse: true },
  trading: { label: '매매 중', color: 'bg-green-500', pulse: true },
  paused: { label: '일시정지', color: 'bg-yellow-500', pulse: false },
  emergency_stop: { label: '긴급정지', color: 'bg-red-600', pulse: false },
}

export default function AutopilotPage() {
  const [state, setState] = useState<State>('off')
  const [regime, setRegime] = useState<Regime>('ranging')
  const [todayPnl, setTodayPnl] = useState(125000)
  const [totalPnl, setTotalPnl] = useState(1850000)
  const [trades, setTrades] = useState(12)
  const [uptime, setUptime] = useState(0)

  // 실시간 시뮬레이션
  useEffect(() => {
    if (state !== 'scanning' && state !== 'trading') return
    const interval = setInterval(() => {
      setTodayPnl((p) => p + Math.round((Math.random() - 0.4) * 5000))
      setTotalPnl((p) => p + Math.round((Math.random() - 0.4) * 5000))
      setUptime((u) => u + 1)
      if (Math.random() < 0.1) {
        setTrades((t) => t + 1)
        setState(Math.random() > 0.5 ? 'trading' : 'scanning')
      }
      if (Math.random() < 0.05) {
        const regimes: Regime[] = [
          'trending_up',
          'trending_down',
          'ranging',
          'volatile',
        ]
        setRegime(regimes[Math.floor(Math.random() * regimes.length)])
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [state])

  const toggleAutopilot = () => {
    if (state === 'off' || state === 'emergency_stop') {
      setState('scanning')
      setUptime(0)
    } else {
      setState('off')
    }
  }

  const stateInfo = STATE_STYLES[state]
  const regimeInfo = REGIME_LABELS[regime]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🛩️ 오토파일럿</h1>
          <p className="text-gray-500">완전 자율 AI 자동매매 시스템</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-3 w-3 rounded-full ${stateInfo.color} ${stateInfo.pulse ? 'animate-pulse' : ''}`}
            />
            <span className="font-bold">{stateInfo.label}</span>
          </div>
          <button
            onClick={toggleAutopilot}
            className={`rounded-xl px-6 py-2.5 font-bold text-white shadow-lg transition-all ${
              state === 'off' || state === 'emergency_stop'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
            }`}
          >
            {state === 'off' || state === 'emergency_stop'
              ? '🛩️ 오토파일럿 ON'
              : '⏹️ 정지'}
          </button>
        </div>
      </div>

      {state !== 'off' && (
        <>
          {/* 시장 상태 + 전략 */}
          <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">현재 시장 상태</p>
                <p className={`text-2xl font-black ${regimeInfo.color}`}>
                  {regimeInfo.icon} {regimeInfo.label}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">자동 선택된 전략</p>
                <p className="text-lg font-bold">{regimeInfo.strategy}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-1">
              {(
                [
                  'trending_up',
                  'ranging',
                  'volatile',
                  'trending_down',
                  'crash',
                ] as Regime[]
              ).map((r) => (
                <div
                  key={r}
                  className={`flex-1 h-2 rounded-full ${regime === r ? REGIME_LABELS[r].color.replace('text-', 'bg-') : 'bg-gray-200'}`}
                />
              ))}
            </div>
          </div>

          {/* 성과 지표 */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">오늘 손익</p>
              <p
                className={`mt-1 text-2xl font-black tabular-nums transition-all duration-500 ${todayPnl >= 0 ? 'text-red-500' : 'text-blue-500'}`}
              >
                {todayPnl >= 0 ? '+' : ''}₩{todayPnl.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">누적 수익</p>
              <p
                className={`mt-1 text-2xl font-black tabular-nums ${totalPnl >= 0 ? 'text-red-500' : 'text-blue-500'}`}
              >
                {totalPnl >= 0 ? '+' : ''}₩{totalPnl.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">오늘 거래</p>
              <p className="mt-1 text-2xl font-black">{trades}건</p>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">업타임</p>
              <p className="mt-1 text-2xl font-black tabular-nums">
                {Math.floor(uptime / 3600)}h {Math.floor((uptime % 3600) / 60)}m
              </p>
            </div>
          </div>

          {/* 오토파일럿 로그 */}
          <div className="rounded-xl border bg-gray-900 p-4 font-mono text-sm text-green-400 max-h-80 overflow-y-auto">
            <p className="text-gray-500 mb-2">
              {'>'} Alphix Autopilot v1.0 — 완전 자율 모드
            </p>
            <p>[{new Date().toLocaleTimeString()}] 🛩️ 오토파일럿 가동 중...</p>
            <p>
              [{new Date().toLocaleTimeString()}] 📡 시장 스캔:{' '}
              {regimeInfo.label} 감지
            </p>
            <p>
              [{new Date().toLocaleTimeString()}] 🔄 전략 선택:{' '}
              {regimeInfo.strategy}
            </p>
            <p>
              [{new Date().toLocaleTimeString()}] 📊 종목 스크리닝:{' '}
              {Math.floor(Math.random() * 5 + 3)}개 매수 후보
            </p>
            {state === 'trading' && (
              <>
                <p className="text-yellow-400">
                  [{new Date().toLocaleTimeString()}] 🟢 매수 실행: SK하이닉스
                  5주 @ ₩185,000
                </p>
                <p>
                  [{new Date().toLocaleTimeString()}] ✅ 리스크 검증 통과
                  (포지션 8.2%)
                </p>
              </>
            )}
            <p>
              [{new Date().toLocaleTimeString()}] 📊 리밸런싱 체크: 정상 (편차
              2.1%)
            </p>
            <p>
              [{new Date().toLocaleTimeString()}] 💚 시스템 정상 — 다음 스캔
              30초 후
            </p>
          </div>

          {/* 컨트롤 패널 */}
          <div className="flex gap-3">
            <button
              onClick={() => setState('paused')}
              disabled={state === 'paused'}
              className="flex-1 rounded-xl border-2 border-yellow-400 py-2.5 font-bold text-yellow-600 hover:bg-yellow-50 disabled:opacity-50"
            >
              ⏸️ 일시정지
            </button>
            <button
              onClick={() => setState('scanning')}
              disabled={state === 'scanning' || state === 'trading'}
              className="flex-1 rounded-xl border-2 border-green-400 py-2.5 font-bold text-green-600 hover:bg-green-50 disabled:opacity-50"
            >
              ▶️ 재개
            </button>
            <button
              onClick={() => setState('emergency_stop')}
              className="flex-1 rounded-xl bg-red-600 py-2.5 font-bold text-white hover:bg-red-700 shadow-lg"
            >
              🚨 긴급 정지
            </button>
          </div>
        </>
      )}

      {state === 'off' && (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-6xl">🛩️</p>
          <p className="mt-4 text-xl font-bold">오토파일럿 대기 중</p>
          <p className="mt-2 text-gray-500">
            버튼을 눌러 완전 자율 자동매매를 시작하세요
          </p>
          <p className="mt-4 text-sm text-gray-400">
            AI가 시장 분석 → 전략 선택 → 매매 실행 → 리스크 관리를 모두 자동으로
            처리합니다
          </p>
        </div>
      )}

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
        ⚠️ 오토파일럿은 완전 자동 매매 시스템입니다. 투자 원금 손실이 발생할 수
        있으며, 과거 수익률이 미래를 보장하지 않습니다. 모든 투자 판단의 최종
        책임은 이용자에게 있습니다.
      </div>
    </div>
  )
}
