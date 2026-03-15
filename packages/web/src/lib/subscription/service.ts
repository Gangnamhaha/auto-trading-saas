import { encrypt } from '@autotrading/shared'

import { query } from '../db'
import { hasAccess, type SubscriptionTier } from './tiers'

type SubscriptionRecord = {
  tier: SubscriptionTier
  status: SubscriptionStatus['status']
  current_period_end: Date | null
  grace_period_end: Date | null
}

export interface SubscriptionStatus {
  tier: SubscriptionTier
  status: 'active' | 'payment_failed' | 'cancelled' | 'grace_period'
  currentPeriodEnd: Date | null
  gracePeriodEnd: Date | null
}

const GRACE_PERIOD_MS = 72 * 60 * 60 * 1000

function toSubscriptionStatus(row?: SubscriptionRecord): SubscriptionStatus {
  if (!row) {
    return {
      tier: 'free',
      status: 'active',
      currentPeriodEnd: null,
      gracePeriodEnd: null,
    }
  }

  return {
    tier: row.tier,
    status: row.status,
    currentPeriodEnd: row.current_period_end,
    gracePeriodEnd: row.grace_period_end,
  }
}

function getEncryptionKey(): string {
  const key = process.env.BILLING_ENCRYPTION_KEY
  if (!key) {
    throw new Error('BILLING_ENCRYPTION_KEY is required')
  }

  return key
}

export function canAccessWithStatus(
  status: SubscriptionStatus,
  requiredTier: SubscriptionTier,
  now: Date = new Date()
): boolean {
  if (!hasAccess(status.tier, requiredTier)) {
    return false
  }

  if (status.status === 'active') {
    return true
  }

  if (status.status === 'grace_period' || status.status === 'payment_failed') {
    return Boolean(
      status.gracePeriodEnd && status.gracePeriodEnd.getTime() > now.getTime()
    )
  }

  if (status.status === 'cancelled') {
    return Boolean(
      status.currentPeriodEnd &&
      status.currentPeriodEnd.getTime() > now.getTime()
    )
  }

  return false
}

export async function getSubscriptionStatus(
  userId: string
): Promise<SubscriptionStatus> {
  const rows = await query<SubscriptionRecord>(
    `SELECT tier, status, current_period_end, grace_period_end
     FROM subscriptions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  )

  return toSubscriptionStatus(rows[0])
}

export async function upgradeTier(
  userId: string,
  tier: SubscriptionTier
): Promise<void> {
  const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  await query(
    `INSERT INTO subscriptions (
      user_id,
      tier,
      status,
      current_period_start,
      current_period_end,
      grace_period_end,
      cancelled_at,
      updated_at
    )
     VALUES ($1, $2, 'active', NOW(), $3, NULL, NULL, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET
       tier = EXCLUDED.tier,
       status = EXCLUDED.status,
       current_period_start = EXCLUDED.current_period_start,
       current_period_end = EXCLUDED.current_period_end,
       grace_period_end = EXCLUDED.grace_period_end,
       cancelled_at = EXCLUDED.cancelled_at,
       updated_at = NOW()`,
    [userId, tier, currentPeriodEnd]
  )

  await query(
    'UPDATE users SET subscription_tier = $2, updated_at = NOW() WHERE id = $1',
    [userId, tier]
  )
}

export async function handlePaymentFailure(userId: string): Promise<void> {
  const gracePeriodEnd = new Date(Date.now() + GRACE_PERIOD_MS)

  await query(
    `UPDATE subscriptions
     SET status = 'grace_period', grace_period_end = $2, updated_at = NOW()
     WHERE user_id = $1`,
    [userId, gracePeriodEnd]
  )
}

export async function cancelSubscription(userId: string): Promise<void> {
  await query(
    `UPDATE subscriptions
     SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
     WHERE user_id = $1`,
    [userId]
  )
}

export async function setBillingKey(
  userId: string,
  billingKey: string
): Promise<void> {
  const encryptedBillingKey = encrypt(billingKey, getEncryptionKey())

  await query(
    `INSERT INTO subscriptions (user_id, billing_key, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET billing_key = EXCLUDED.billing_key, updated_at = NOW()`,
    [userId, encryptedBillingKey]
  )
}

export async function clearBillingKey(userId: string): Promise<void> {
  await query(
    `UPDATE subscriptions
     SET billing_key = NULL, updated_at = NOW()
     WHERE user_id = $1`,
    [userId]
  )
}
