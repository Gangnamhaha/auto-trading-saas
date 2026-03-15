import { NextResponse } from 'next/server'

export async function GET() {
  const strategies = [
    {
      name: 'ma_crossover',
      displayName: '이동평균 크로스오버',
      description: '5일/20일 이동평균 교차 시 매매',
      tier: 'free',
    },
    {
      name: 'rsi',
      displayName: 'RSI',
      description: 'RSI 과매도(30)/과매수(70) 구간에서 매매',
      tier: 'free',
    },
    {
      name: 'bollinger_bands',
      displayName: '볼린저밴드',
      description: '밴드 하단/상단 터치 시 매매',
      tier: 'basic',
    },
    {
      name: 'macd',
      displayName: 'MACD',
      description: 'MACD/시그널 라인 크로스오버 매매',
      tier: 'basic',
    },
    {
      name: 'grid_trading',
      displayName: '그리드 트레이딩',
      description: '가격 구간 분할 자동 매매',
      tier: 'pro',
    },
  ]
  return NextResponse.json(strategies)
}
