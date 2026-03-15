import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: '이메일 주소를 입력해주세요.' },
        { status: 400 }
      )
    }
    // MVP: Always return success (don't reveal if email exists)
    // TODO: Implement actual reset flow with Resend
    return NextResponse.json({
      message: '비밀번호 재설정 이메일이 발송되었습니다.',
    })
  } catch {
    return NextResponse.json(
      { error: '요청을 처리할 수 없습니다.' },
      { status: 500 }
    )
  }
}
