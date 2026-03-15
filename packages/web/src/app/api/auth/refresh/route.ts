import { NextResponse } from 'next/server'

import {
  generateAccessToken,
  verifyRefreshToken,
} from '../../../../lib/auth/auth'

type RefreshBody = {
  refreshToken?: string
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as RefreshBody
  const refreshToken = body.refreshToken

  if (!refreshToken) {
    return NextResponse.json(
      { error: 'Refresh token is required' },
      { status: 401 }
    )
  }

  try {
    const payload = verifyRefreshToken(refreshToken)
    return NextResponse.json(
      { accessToken: generateAccessToken(payload) },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Invalid refresh token' },
      { status: 401 }
    )
  }
}
