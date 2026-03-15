import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      strategy,
      symbol,
      startDate,
      endDate,
      initialCapital = 10000000,
    } = body

    if (!strategy || !symbol) {
      return NextResponse.json(
        { error: '전략과 종목을 선택해주세요.' },
        { status: 400 }
      )
    }

    const mockResult = {
      totalReturn: 12.5,
      maxDrawdown: -8.3,
      sharpeRatio: 1.45,
      winRate: 58.3,
      totalTrades: 24,
      finalCapital: initialCapital * 1.125,
      period: {
        start: startDate ?? '2024-01-01',
        end: endDate ?? '2024-12-31',
      },
      strategy,
      symbol,
    }
    return NextResponse.json(mockResult)
  } catch {
    return NextResponse.json(
      { error: '백테스트 실행에 실패했습니다.' },
      { status: 500 }
    )
  }
}
