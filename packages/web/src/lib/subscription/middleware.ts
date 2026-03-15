import { NextResponse, type NextRequest } from 'next/server'

import { verifyAccessToken } from '../auth/auth'
import { canAccessWithStatus, getSubscriptionStatus } from './service'
import { type SubscriptionTier } from './tiers'

type RouteHandler = (req: NextRequest) => Promise<NextResponse> | NextResponse

type CurrentUser = {
  id: string
}

export function requireTier(minTier: SubscriptionTier) {
  return function withTier(handler: RouteHandler): RouteHandler {
    return async function withTierCheck(
      req: NextRequest
    ): Promise<NextResponse> {
      const user = await getCurrentUser(req)
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const subscription = await getSubscriptionStatus(user.id)
      if (!canAccessWithStatus(subscription, minTier)) {
        return NextResponse.json(
          {
            error: 'Subscription required',
            requiredTier: minTier,
          },
          { status: 403 }
        )
      }

      return handler(req)
    }
  }
}

export async function getCurrentUser(
  req: NextRequest
): Promise<CurrentUser | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice('Bearer '.length)

  try {
    const payload = verifyAccessToken(token)
    return { id: payload.userId }
  } catch {
    return null
  }
}
