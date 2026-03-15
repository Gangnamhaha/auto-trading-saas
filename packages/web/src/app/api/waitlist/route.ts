import { NextRequest, NextResponse } from 'next/server'
import { trackWaitlistJoined } from '@/lib/analytics/analytics'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: '이메일을 입력해주세요.' },
        { status: 400 }
      )
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { success: false, message: '올바른 이메일 형식을 입력해주세요.' },
        { status: 400 }
      )
    }

    console.log('[Waitlist] New signup:', email)
    trackWaitlistJoined(email)

    return NextResponse.json({
      success: true,
      message:
        '대기 신청이 완료되었습니다. 정식 출시 시 이메일로 알려드리겠습니다.',
    })
  } catch (error) {
    console.error('[Waitlist] Error:', error)
    return NextResponse.json(
      {
        success: false,
        message: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      },
      { status: 500 }
    )
  }
}
