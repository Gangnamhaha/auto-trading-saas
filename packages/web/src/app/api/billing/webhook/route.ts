import { createHmac, timingSafeEqual } from 'node:crypto'

import { NextResponse, type NextRequest } from 'next/server'

import {
  cancelSubscription,
  clearBillingKey,
  handlePaymentFailure,
  upgradeTier,
} from '../../../../lib/subscription/service'
import { type SubscriptionTier } from '../../../../lib/subscription/tiers'

type TossWebhookEvent = {
  eventType?: string
  data?: {
    status?: string
    customerKey?: string
    metadata?: {
      userId?: string
      tier?: SubscriptionTier
    }
  }
}

function getWebhookSecret(): string {
  const secret = process.env.TOSS_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('TOSS_WEBHOOK_SECRET is required')
  }

  return secret
}

function isValidWebhookSignature(payload: string, signature: string): boolean {
  const digest = createHmac('sha256', getWebhookSecret())
    .update(payload)
    .digest('hex')

  const given = Buffer.from(signature)
  const expected = Buffer.from(digest)

  if (given.length !== expected.length) {
    return false
  }

  return timingSafeEqual(given, expected)
}

function parseUserId(event: TossWebhookEvent): string | null {
  return event.data?.metadata?.userId ?? event.data?.customerKey ?? null
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text()
  const signature =
    req.headers.get('Tosspayments-Signature') ??
    req.headers.get('x-toss-signature')

  if (!signature || !isValidWebhookSignature(rawBody, signature)) {
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 401 }
    )
  }

  const event = JSON.parse(rawBody) as TossWebhookEvent
  const userId = parseUserId(event)

  if (!userId) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  if (event.eventType === 'PAYMENT_STATUS_CHANGED') {
    if (event.data?.status === 'DONE') {
      const tier = event.data.metadata?.tier ?? 'basic'
      await upgradeTier(userId, tier)
    }

    if (event.data?.status === 'FAILED') {
      await handlePaymentFailure(userId)
    }

    if (event.data?.status === 'CANCELED') {
      await cancelSubscription(userId)
    }
  }

  if (event.eventType === 'BILLING_KEY_DELETED') {
    await clearBillingKey(userId)
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
