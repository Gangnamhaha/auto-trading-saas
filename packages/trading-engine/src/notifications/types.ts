export type NotificationType =
  | 'trade_executed'
  | 'risk_violation'
  | 'circuit_breaker'
  | 'daily_summary'
  | 'error'

export interface Notification {
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  data?: Record<string, unknown>
}

export interface NotificationChannel {
  name: string
  send(notification: Notification): Promise<void>
}
