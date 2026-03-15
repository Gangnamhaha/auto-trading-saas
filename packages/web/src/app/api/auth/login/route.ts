import { NextResponse } from 'next/server'

import {
  generateAccessToken,
  generateRefreshToken,
  type TokenPayload,
} from '../../../../lib/auth/auth'
import { verifyPassword } from '../../../../lib/auth/password'
import { query } from '../../../../lib/db'

type LoginBody = {
  email?: string
  password?: string
}

type UserRecord = {
  id: string
  email: string
  hashed_password: string
  subscription_tier: TokenPayload['subscriptionTier']
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as LoginBody
  const email = body.email?.trim().toLowerCase()
  const password = body.password

  if (!email || !password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const users = await query<UserRecord>(
    `SELECT id, email, hashed_password, subscription_tier
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email]
  )

  const user = users[0]
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const validPassword = await verifyPassword(password, user.hashed_password)
  if (!validPassword) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    subscriptionTier: user.subscription_tier,
  }

  return NextResponse.json(
    {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    },
    { status: 200 }
  )
}
