import { NextResponse, type NextRequest } from 'next/server'

import { getCurrentUser } from '../../../../lib/subscription/middleware'
import {
  setBillingKey,
  upgradeTier,
} from '../../../../lib/subscription/service'
import {
  SUBSCRIPTION_TIERS,
  type SubscriptionTier,
} from '../../../../lib/subscription/tiers'

type SubscribeBody = {
  tier?: SubscriptionTier
  billingKey?: string
}

const PAID_TIERS: SubscriptionTier[] = ['basic', 'pro']

export async function POST(req: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json()) as SubscribeBody
  const tier = body.tier
  const billingKey = body.billingKey?.trim()

  if (!tier || !PAID_TIERS.includes(tier)) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

  if (!billingKey) {
    return NextResponse.json(
      { error: 'Billing key is required' },
      { status: 400 }
    )
  }

  await setBillingKey(user.id, billingKey)
  await upgradeTier(user.id, tier)

  return NextResponse.json(
    {
      ok: true,
      tier,
      price: SUBSCRIPTION_TIERS[tier].price,
    },
    { status: 200 }
  )
}
