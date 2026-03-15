import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'

export type SubscriptionTier = 'free' | 'basic' | 'pro'

export type TokenPayload = {
  userId: string
  email: string
  subscriptionTier: SubscriptionTier
}

const ACCESS_TOKEN_EXPIRES_IN = '15m'
const REFRESH_TOKEN_EXPIRES_IN = '7d'

function getRequiredSecret(
  name: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET'
): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

function verifyToken(token: string, secret: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, secret)
    if (typeof decoded === 'string') {
      throw new Error('Invalid token payload')
    }

    const { userId, email, subscriptionTier } = decoded as Partial<TokenPayload>
    if (!userId || !email || !subscriptionTier) {
      throw new Error('Invalid token payload')
    }

    return {
      userId,
      email,
      subscriptionTier,
    }
  } catch (error) {
    if (
      error instanceof TokenExpiredError ||
      error instanceof JsonWebTokenError
    ) {
      throw new Error('Invalid or expired token')
    }

    throw error
  }
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, getRequiredSecret('JWT_ACCESS_SECRET'), {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  })
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, getRequiredSecret('JWT_REFRESH_SECRET'), {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  })
}

export function verifyAccessToken(token: string): TokenPayload {
  return verifyToken(token, getRequiredSecret('JWT_ACCESS_SECRET'))
}

export function verifyRefreshToken(token: string): TokenPayload {
  return verifyToken(token, getRequiredSecret('JWT_REFRESH_SECRET'))
}
