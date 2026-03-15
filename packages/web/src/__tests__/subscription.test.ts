import { NextRequest, NextResponse } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { requireTier } from '../lib/subscription/middleware'
import { canAccessWithStatus } from '../lib/subscription/service'
import { hasAccess, supportsStrategyCount } from '../lib/subscription/tiers'
import { processWebhookEvent } from '../lib/subscription/webhook'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Subscription', () => {
  describe('hasAccess', () => {
    it('free user cannot access basic features', () => {
      expect(hasAccess('free', 'basic')).toBe(false)
    })

    it('free user cannot access pro features', () => {
      expect(hasAccess('free', 'pro')).toBe(false)
    })

    it('basic user can access basic features', () => {
      expect(hasAccess('basic', 'basic')).toBe(true)
    })

    it('basic user cannot access pro features', () => {
      expect(hasAccess('basic', 'pro')).toBe(false)
    })

    it('pro user can access all features', () => {
      expect(hasAccess('pro', 'free')).toBe(true)
      expect(hasAccess('pro', 'basic')).toBe(true)
      expect(hasAccess('pro', 'pro')).toBe(true)
    })
  })

  describe('grace period', () => {
    it('payment_failed user retains access within 72h', () => {
      const now = new Date('2026-01-01T00:00:00.000Z')
      const gracePeriodEnd = new Date('2026-01-03T23:59:59.000Z')

      expect(
        canAccessWithStatus(
          {
            tier: 'basic',
            status: 'grace_period',
            currentPeriodEnd: null,
            gracePeriodEnd,
          },
          'basic',
          now
        )
      ).toBe(true)
    })

    it('payment_failed user loses access after 72h', () => {
      const now = new Date('2026-01-04T00:00:01.000Z')
      const gracePeriodEnd = new Date('2026-01-03T23:59:59.000Z')

      expect(
        canAccessWithStatus(
          {
            tier: 'basic',
            status: 'grace_period',
            currentPeriodEnd: null,
            gracePeriodEnd,
          },
          'basic',
          now
        )
      ).toBe(false)
    })
  })

  describe('tier limits', () => {
    it('free tier allows max 1 strategy', () => {
      expect(supportsStrategyCount('free', 1)).toBe(true)
      expect(supportsStrategyCount('free', 2)).toBe(false)
    })

    it('basic tier allows max 2 strategies', () => {
      expect(supportsStrategyCount('basic', 2)).toBe(true)
      expect(supportsStrategyCount('basic', 3)).toBe(false)
    })

    it('pro tier allows unlimited strategies', () => {
      expect(supportsStrategyCount('pro', 1000)).toBe(true)
    })
  })

  it('returns 403 for free user trying to access pro endpoint', async () => {
    const guarded = requireTier('pro', {
      getCurrentUser: async () => ({ id: 'user-1' }),
      getSubscriptionStatus: async () => ({
        tier: 'free',
        status: 'active',
        currentPeriodEnd: null,
        gracePeriodEnd: null,
      }),
      canAccessWithStatus: () => false,
    })(() => NextResponse.json({ ok: true }, { status: 200 }))

    const req = new NextRequest('http://localhost/api/protected', {
      headers: {
        authorization: 'Bearer any-token',
      },
    })

    const response = await guarded(req)
    expect(response.status).toBe(403)
  })

  it('upgrades user tier on paid webhook event', async () => {
    const upgradeTier = vi.fn(async () => undefined)
    const cancelSubscription = vi.fn(async () => undefined)
    const handlePaymentFailure = vi.fn(async () => undefined)
    const clearBillingKey = vi.fn(async () => undefined)

    const payload = JSON.stringify({
      eventType: 'PAYMENT_STATUS_CHANGED',
      data: {
        status: 'DONE',
        customerKey: 'user-123',
        metadata: {
          userId: 'user-123',
          tier: 'pro',
        },
      },
    })

    await processWebhookEvent(JSON.parse(payload), {
      upgradeTier,
      cancelSubscription,
      handlePaymentFailure,
      clearBillingKey,
    })

    expect(upgradeTier).toHaveBeenCalledWith('user-123', 'pro')
    expect(cancelSubscription).not.toHaveBeenCalled()
    expect(handlePaymentFailure).not.toHaveBeenCalled()
    expect(clearBillingKey).not.toHaveBeenCalled()
  })
})
