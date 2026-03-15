import type { Notification, NotificationChannel } from './types'

export class WebhookChannel implements NotificationChannel {
  name = 'webhook'

  constructor(private webhookUrl: string) {}

  async send(notification: Notification): Promise<void> {
    await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: notification.type,
        title: notification.title,
        message: notification.message,
        timestamp: notification.timestamp.toISOString(),
        data: notification.data,
      }),
    })
  }
}
