import { NextResponse, type NextRequest } from 'next/server'

import { verifyAccessToken } from '../auth/auth'
import { canAccessWithStatus, getSubscriptionStatus } from './service'
import { type SubscriptionTier } from './tiers'

type RouteHandler = (req: NextRequest) => Promise<NextResponse> | NextResponse

type CurrentUser = {
  id: string
}

type RequireTierDeps = {
  getCurrentUser: (req: NextRequest) => Promise<CurrentUser | null>
  getSubscriptionStatus: typeof getSubscriptionStatus
  canAccessWithStatus: typeof canAccessWithStatus
}

export function requireTier(
  minTier: SubscriptionTier,
  deps: RequireTierDeps = {
    getCurrentUser,
    getSubscriptionStatus,
    canAccessWithStatus,
  }
) {
  return function withTier(handler: RouteHandler): RouteHandler {
    return async function withTierCheck(
      req: NextRequest
    ): Promise<NextResponse> {
      const user = await deps.getCurrentUser(req)
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const subscription = await deps.getSubscriptionStatus(user.id)
      if (!deps.canAccessWithStatus(subscription, minTier)) {
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
