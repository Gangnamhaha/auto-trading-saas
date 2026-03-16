import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { traderNickname, allocatedCapital } = await req.json()
    if (!traderNickname || !allocatedCapital) {
      return NextResponse.json(
        { error: '트레이더와 투자금을 입력해주세요.' },
        { status: 400 }
      )
    }
    return NextResponse.json({
      success: true,
      copyId: `COPY-${Date.now()}`,
      trader: traderNickname,
      allocatedCapital,
      message: `${traderNickname}의 전략 복사 시작`,
      warning: '⚠️ 카피 트레이딩은 원금 손실이 발생할 수 있습니다.',
    })
  } catch {
    return NextResponse.json({ error: '요청 처리 실패' }, { status: 500 })
  }
}
