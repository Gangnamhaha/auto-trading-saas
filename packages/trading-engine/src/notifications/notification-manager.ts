import type {
  Notification,
  NotificationChannel,
  NotificationType,
} from './types'

export class NotificationManager {
  private channels: NotificationChannel[] = []

  addChannel(channel: NotificationChannel): void {
    this.channels.push(channel)
  }

  removeChannel(name: string): void {
    this.channels = this.channels.filter((c) => c.name !== name)
  }

  async notify(
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    const notification: Notification = {
      type,
      title,
      message,
      timestamp: new Date(),
      data,
    }
    await Promise.allSettled(this.channels.map((ch) => ch.send(notification)))
  }

  getChannels(): string[] {
    return this.channels.map((c) => c.name)
  }
}
