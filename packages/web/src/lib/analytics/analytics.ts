/**
 * Analytics utilities for GA4 and Mixpanel event tracking
 * In development mode, events are logged to console instead
 */

// Extend Window interface for analytics globals
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    mixpanel?: {
      track: (eventName: string, properties?: Record<string, unknown>) => void
      identify: (userId: string) => void
      reset: () => void
    }
  }
}

/**
 * Predefined event names for consistent tracking
 */
export const EVENTS = {
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  BROKER_CONNECTED: 'broker_connected',
  BACKTEST_RUN: 'backtest_run',
  STRATEGY_ACTIVATED: 'strategy_activated',
  STRATEGY_PAUSED: 'strategy_paused',
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  WAITLIST_JOINED: 'waitlist_joined',
  PAGE_VIEW: 'page_view',
  CTA_CLICK: 'cta_click',
  DEMO_VIEWED: 'demo_viewed',
  PRICING_VIEWED: 'pricing_viewed',
} as const

export type EventName = (typeof EVENTS)[keyof typeof EVENTS]

/**
 * Track an event in both GA4 and Mixpanel
 * @param eventName - The name of the event to track
 * @param properties - Optional properties to include with the event
 */
export function trackEvent(
  eventName: EventName,
  properties?: Record<string, unknown>
): void {
  // Development mode: log to console
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[Analytics]', eventName, properties || {})
    return
  }

  // GA4 tracking
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, properties || {})
  }

  // Mixpanel tracking
  if (typeof window !== 'undefined' && window.mixpanel) {
    window.mixpanel.track(eventName, properties)
  }
}

/**
 * Track a page view
 * @param pageName - The name of the page being viewed
 * @param properties - Optional additional properties
 */
export function trackPageView(
  pageName: string,
  properties?: Record<string, unknown>
): void {
  trackEvent(EVENTS.PAGE_VIEW, { page_name: pageName, ...properties })
}

/**
 * Track a CTA button click
 * @param ctaName - The name/identifier of the CTA
 * @param properties - Optional additional properties
 */
export function trackCTAClick(
  ctaName: string,
  properties?: Record<string, unknown>
): void {
  trackEvent(EVENTS.CTA_CLICK, { cta_name: ctaName, ...properties })
}

/**
 * Identify a user in Mixpanel
 * @param userId - The user's unique identifier
 */
export function identifyUser(userId: string): void {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[Analytics] Identify user:', userId)
    return
  }

  if (typeof window !== 'undefined' && window.mixpanel) {
    window.mixpanel.identify(userId)
  }
}

/**
 * Reset user identification (for logout)
 */
export function resetUser(): void {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[Analytics] Reset user')
    return
  }

  if (typeof window !== 'undefined' && window.mixpanel) {
    window.mixpanel.reset()
  }
}

/**
 * Track waitlist signup
 * @param email - The email that signed up (hashed for privacy)
 */
export function trackWaitlistJoined(email: string): void {
  // Hash email for privacy
  const hashedEmail =
    email.split('@')[0].slice(0, 3) + '***@' + email.split('@')[1]
  trackEvent(EVENTS.WAITLIST_JOINED, { email_domain: hashedEmail })
}

/**
 * Track signup flow events
 */
export const signupTracking = {
  started: (method: 'email' | 'google' | 'kakao') => {
    trackEvent(EVENTS.SIGNUP_STARTED, { method })
  },
  completed: (userId: string, method: 'email' | 'google' | 'kakao') => {
    trackEvent(EVENTS.SIGNUP_COMPLETED, { method })
    identifyUser(userId)
  },
}

/**
 * Track broker connection events
 */
export const brokerTracking = {
  connected: (brokerName: string) => {
    trackEvent(EVENTS.BROKER_CONNECTED, { broker: brokerName })
  },
}

/**
 * Track backtest events
 */
export const backtestTracking = {
  run: (strategyId: string, strategyName: string) => {
    trackEvent(EVENTS.BACKTEST_RUN, {
      strategy_id: strategyId,
      strategy_name: strategyName,
    })
  },
}

/**
 * Track strategy events
 */
export const strategyTracking = {
  activated: (strategyId: string, strategyName: string) => {
    trackEvent(EVENTS.STRATEGY_ACTIVATED, {
      strategy_id: strategyId,
      strategy_name: strategyName,
    })
  },
  paused: (strategyId: string, strategyName: string) => {
    trackEvent(EVENTS.STRATEGY_PAUSED, {
      strategy_id: strategyId,
      strategy_name: strategyName,
    })
  },
}

/**
 * Track subscription events
 */
export const subscriptionTracking = {
  started: (plan: 'free' | 'basic' | 'pro') => {
    trackEvent(EVENTS.SUBSCRIPTION_STARTED, { plan })
  },
  cancelled: (plan: 'free' | 'basic' | 'pro') => {
    trackEvent(EVENTS.SUBSCRIPTION_CANCELLED, { plan })
  },
}
