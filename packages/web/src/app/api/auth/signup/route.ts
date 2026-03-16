import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'

type SignupBody = { email?: string; password?: string }

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as SignupBody
  const email = body.email?.trim().toLowerCase()
  const password = body.password

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: '올바른 이메일을 입력하세요.' },
      { status: 400 }
    )
  }
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: '비밀번호는 8자 이상이어야 합니다.' },
      { status: 400 }
    )
  }

  const userId = randomUUID()

  // MVP: DB 없이 즉시 토큰 발급 (프로덕션에서는 DB 저장 후 발급)
  const accessToken = Buffer.from(
    JSON.stringify({
      userId,
      email,
      tier: 'free',
      exp: Date.now() + 15 * 60 * 1000,
    })
  ).toString('base64')

  const refreshToken = Buffer.from(
    JSON.stringify({
      userId,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    })
  ).toString('base64')

  return NextResponse.json(
    {
      user: { id: userId, email },
      accessToken,
      refreshToken,
    },
    { status: 201 }
  )
}
