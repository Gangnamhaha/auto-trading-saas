import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { strategyId } = await req.json()

    // TODO: Get user from JWT token
    // TODO: Check paper trading start date from DB

    // For MVP: enforce 30-day minimum paper trading
    // const paperStartDate = await getPaperTradingStartDate(userId, strategyId)
    // const daysSinceStart = Math.floor((Date.now() - paperStartDate.getTime()) / (1000 * 60 * 60 * 24))

    // Placeholder: always reject (paper trading gate)
    // In production, check actual paper trading duration
    const daysSinceStart = 0

    if (daysSinceStart < 30) {
      return NextResponse.json(
        {
          error:
            '실전 전환을 위해서는 최소 30일간 페이퍼트레이딩이 필요합니다.',
          daysRequired: 30,
          daysCompleted: daysSinceStart,
          daysRemaining: 30 - daysSinceStart,
        },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '실전 모드로 전환되었습니다. 주의: 실제 자금이 사용됩니다.',
    })
  } catch {
    return NextResponse.json(
      { error: '요청을 처리할 수 없습니다.' },
      { status: 500 }
    )
  }
}
