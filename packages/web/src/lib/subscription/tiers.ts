export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    maxStrategies: 1,
    allowLiveTrading: false,
    maxBacktestsPerMonth: 5,
    prioritySupport: false,
  },
  basic: {
    name: 'Basic',
    price: 9900,
    maxStrategies: 2,
    allowLiveTrading: true,
    maxBacktestsPerMonth: Number.POSITIVE_INFINITY,
    prioritySupport: false,
  },
  pro: {
    name: 'Pro',
    price: 29900,
    maxStrategies: Number.POSITIVE_INFINITY,
    allowLiveTrading: true,
    maxBacktestsPerMonth: Number.POSITIVE_INFINITY,
    prioritySupport: true,
  },
} as const

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS

const TIER_ORDER: SubscriptionTier[] = ['free', 'basic', 'pro']

export function hasAccess(
  userTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(requiredTier)
}

export function supportsStrategyCount(
  tier: SubscriptionTier,
  strategyCount: number
): boolean {
  return strategyCount <= SUBSCRIPTION_TIERS[tier].maxStrategies
}
