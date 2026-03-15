import {
  cancelSubscription,
  clearBillingKey,
  handlePaymentFailure,
  upgradeTier,
} from './service'
import { type SubscriptionTier } from './tiers'

export type TossWebhookEvent = {
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

type WebhookHandlers = {
  upgradeTier: typeof upgradeTier
  cancelSubscription: typeof cancelSubscription
  handlePaymentFailure: typeof handlePaymentFailure
  clearBillingKey: typeof clearBillingKey
}

function parseUserId(event: TossWebhookEvent): string | null {
  return event.data?.metadata?.userId ?? event.data?.customerKey ?? null
}

export async function processWebhookEvent(
  event: TossWebhookEvent,
  handlers: WebhookHandlers = {
    upgradeTier,
    cancelSubscription,
    handlePaymentFailure,
    clearBillingKey,
  }
): Promise<void> {
  const userId = parseUserId(event)
  if (!userId) {
    return
  }

  if (event.eventType === 'PAYMENT_STATUS_CHANGED') {
    if (event.data?.status === 'DONE') {
      const tier = event.data.metadata?.tier ?? 'basic'
      await handlers.upgradeTier(userId, tier)
    }

    if (event.data?.status === 'FAILED') {
      await handlers.handlePaymentFailure(userId)
    }

    if (event.data?.status === 'CANCELED') {
      await handlers.cancelSubscription(userId)
    }
  }

  if (event.eventType === 'BILLING_KEY_DELETED') {
    await handlers.clearBillingKey(userId)
  }
}
