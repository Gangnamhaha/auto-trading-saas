import { NextResponse } from 'next/server'

export async function GET() {
  const status = {
    state: 'running',
    uptime: Date.now() - new Date('2024-01-01').getTime(),
    activatedStrategies: 2,
    totalTradesExecuted: 15,
    lastTickAt: new Date().toISOString(),
    marketOpen: isKSTMarketHours(),
    strategies: [
      {
        id: 'strat-0',
        name: 'ma_crossover',
        symbol: '005930',
        mode: 'paper',
        isActive: true,
      },
      {
        id: 'strat-1',
        name: 'rsi',
        symbol: '000660',
        mode: 'paper',
        isActive: true,
      },
    ],
  }
  return NextResponse.json(status)
}

function isKSTMarketHours(): boolean {
  const kst = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
  )
  const day = kst.getDay()
  if (day === 0 || day === 6) return false
  const mins = kst.getHours() * 60 + kst.getMinutes()
  return mins >= 540 && mins < 930
}
