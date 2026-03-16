import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'

type LoginBody = { email?: string; password?: string }

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as LoginBody
  const email = body.email?.trim().toLowerCase()
  const password = body.password

  if (!email || !password) {
    return NextResponse.json(
      { error: '이메일과 비밀번호를 입력하세요.' },
      { status: 400 }
    )
  }

  // MVP: 비밀번호 8자 이상이면 로그인 허용 (프로덕션에서는 DB 검증)
  if (password.length < 8) {
    return NextResponse.json(
      { error: '이메일 또는 비밀번호가 잘못되었습니다.' },
      { status: 401 }
    )
  }

  const userId = randomUUID()

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

  return NextResponse.json({ accessToken, refreshToken })
}
