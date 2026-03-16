'use client'

import { useState } from 'react'

interface Trader {
  rank: number
  nickname: string
  tier: string
  strategy: string
  totalReturn: number
  winRate: number
  trades: number
  followers: number
  mdd: number
  sharpe: number
}

const MOCK_TRADERS: Trader[] = [
  {
    rank: 1,
    nickname: 'QuantKing',
    tier: 'pro',
    strategy: 'AI 분석',
    totalReturn: 34.5,
    winRate: 72.3,
    trades: 234,
    followers: 156,
    mdd: -8.2,
    sharpe: 2.1,
  },
  {
    rank: 2,
    nickname: 'ValueHunter',
    tier: 'pro',
    strategy: 'MACD',
    totalReturn: 28.7,
    winRate: 68.1,
    trades: 189,
    followers: 98,
    mdd: -11.5,
    sharpe: 1.8,
  },
  {
    rank: 3,
    nickname: 'TrendRider',
    tier: 'basic',
    strategy: 'MA 크로스오버',
    totalReturn: 22.1,
    winRate: 65.4,
    trades: 312,
    followers: 87,
    mdd: -9.8,
    sharpe: 1.5,
  },
  {
    rank: 4,
    nickname: 'GridMaster',
    tier: 'pro',
    strategy: '그리드 트레이딩',
    totalReturn: 19.8,
    winRate: 78.2,
    trades: 456,
    followers: 64,
    mdd: -5.3,
    sharpe: 1.9,
  },
  {
    rank: 5,
    nickname: 'RSI_Pro',
    tier: 'basic',
    strategy: 'RSI',
    totalReturn: 17.3,
    winRate: 62.8,
    trades: 167,
    followers: 52,
    mdd: -12.1,
    sharpe: 1.3,
  },
  {
    rank: 6,
    nickname: 'BollingerFan',
    tier: 'pro',
    strategy: '볼린저밴드',
    totalReturn: 15.9,
    winRate: 61.5,
    trades: 198,
    followers: 41,
    mdd: -10.7,
    sharpe: 1.2,
  },
  {
    rank: 7,
    nickname: 'SafeTrader',
    tier: 'basic',
    strategy: 'MA 크로스오버',
    totalReturn: 12.4,
    winRate: 58.9,
    trades: 89,
    followers: 33,
    mdd: -6.4,
    sharpe: 1.4,
  },
  {
    rank: 8,
    nickname: 'AITrader',
    tier: 'pro',
    strategy: 'AI 분석',
    totalReturn: 11.8,
    winRate: 57.2,
    trades: 145,
    followers: 28,
    mdd: -14.3,
    sharpe: 1.0,
  },
]

export default function SocialPage() {
  const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null)
  const [copyAmount, setCopyAmount] = useState('')
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<'leaderboard' | 'my-copies'>('leaderboard')

  const handleCopy = () => {
    if (!selectedTrader || !copyAmount) return
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
      setSelectedTrader(null)
      setCopyAmount('')
    }, 3000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🏆 소셜 트레이딩</h1>
        <p className="text-gray-500">
          상위 트레이더의 전략을 복사하고 함께 수익을 만드세요
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        ⚠️ 카피 트레이딩은 투자 원금 손실이 발생할 수 있습니다. 과거 수익률이
        미래 수익을 보장하지 않습니다. 다른 트레이더의 성과를 복사하더라도 모든
        투자 판단의 책임은 본인에게 있습니다.
      </div>

      {/* 탭 */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab('leaderboard')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'leaderboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
        >
          🏆 리더보드
        </button>
        <button
          onClick={() => setTab('my-copies')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'my-copies' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
        >
          📋 나의 카피
        </button>
      </div>

      {tab === 'leaderboard' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {MOCK_TRADERS.map((trader) => (
            <div
              key={trader.rank}
              className={`rounded-xl border bg-white p-4 transition-all hover:shadow-lg ${trader.rank <= 3 ? 'border-amber-200' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      trader.rank === 1
                        ? 'bg-yellow-400 text-white'
                        : trader.rank === 2
                          ? 'bg-gray-300 text-white'
                          : trader.rank === 3
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {trader.rank}
                  </span>
                  <div>
                    <p className="font-bold">{trader.nickname}</p>
                    <p className="text-xs text-gray-500">{trader.strategy}</p>
                  </div>
                </div>
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                    trader.tier === 'pro'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {trader.tier.toUpperCase()}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">수익률</p>
                  <p className="font-bold text-red-500">
                    +{trader.totalReturn}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">승률</p>
                  <p className="font-bold">{trader.winRate}%</p>
                </div>
                <div>
                  <p className="text-gray-500">MDD</p>
                  <p className="font-medium text-blue-500">{trader.mdd}%</p>
                </div>
                <div>
                  <p className="text-gray-500">샤프비율</p>
                  <p className="font-medium">{trader.sharpe}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-gray-500">
                <span>{trader.trades}건 거래</span>
                <span>👥 {trader.followers}명 팔로우</span>
              </div>

              <button
                onClick={() => setSelectedTrader(trader)}
                className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                전략 복사하기
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'my-copies' && (
        <div className="rounded-lg border bg-white p-8 text-center">
          <p className="text-4xl">📭</p>
          <p className="mt-2 font-medium text-gray-600">
            아직 복사 중인 전략이 없습니다
          </p>
          <p className="mt-1 text-sm text-gray-400">
            리더보드에서 트레이더를 선택하여 전략을 복사해보세요
          </p>
          <button
            onClick={() => setTab('leaderboard')}
            className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-sm text-white hover:bg-blue-700"
          >
            리더보드 보기
          </button>
        </div>
      )}

      {/* 카피 모달 */}
      {selectedTrader && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSelectedTrader(null)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {copied ? (
              <div className="text-center">
                <p className="text-5xl">✅</p>
                <p className="mt-3 text-xl font-bold">카피 트레이딩 시작!</p>
                <p className="mt-2 text-gray-500">
                  {selectedTrader.nickname}의 전략을 복사합니다
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold">
                  전략 복사 — {selectedTrader.nickname}
                </h3>
                <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
                  <div className="flex justify-between">
                    <span>전략</span>
                    <span className="font-medium">
                      {selectedTrader.strategy}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>수익률</span>
                    <span className="font-medium text-red-500">
                      +{selectedTrader.totalReturn}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>승률</span>
                    <span className="font-medium">
                      {selectedTrader.winRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>MDD</span>
                    <span className="font-medium text-blue-500">
                      {selectedTrader.mdd}%
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-sm font-medium">투자금 설정</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="number"
                      value={copyAmount}
                      onChange={(e) => setCopyAmount(e.target.value)}
                      placeholder="1,000,000"
                      className="w-full rounded-lg border px-3 py-2"
                    />
                    <span className="text-sm text-gray-500">원</span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {[500000, 1000000, 5000000, 10000000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setCopyAmount(String(amt))}
                        className="rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                      >
                        {(amt / 10000).toLocaleString()}만
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
                  ⚠️ 과거 수익률이 미래 수익을 보장하지 않습니다. 투자 원금
                  손실이 발생할 수 있습니다.
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setSelectedTrader(null)}
                    className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleCopy}
                    disabled={!copyAmount || Number(copyAmount) < 100000}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    복사 시작
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
