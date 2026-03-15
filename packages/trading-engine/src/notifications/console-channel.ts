import type { Notification, NotificationChannel } from './types'

export class ConsoleChannel implements NotificationChannel {
  name = 'console'

  async send(notification: Notification): Promise<void> {
    const prefix = this.getPrefix(notification.type)
    // eslint-disable-next-line no-console
    console.log(
      `${prefix} [${notification.timestamp.toISOString()}] ${notification.title}: ${notification.message}`
    )
  }

  private getPrefix(type: string): string {
    switch (type) {
      case 'trade_executed':
        return '[TRADE]'
      case 'risk_violation':
        return '[RISK]'
      case 'circuit_breaker':
        return '[CIRCUIT]'
      case 'daily_summary':
        return '[SUMMARY]'
      case 'error':
        return '[ERROR]'
      default:
        return '[INFO]'
    }
  }
}
