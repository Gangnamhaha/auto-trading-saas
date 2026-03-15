import { describe, expect, it, vi } from 'vitest'
import { NotificationManager } from '../notifications/notification-manager'
import { ConsoleChannel } from '../notifications/console-channel'
import { WebhookChannel } from '../notifications/webhook-channel'
import type { NotificationChannel } from '../notifications/types'

describe('NotificationManager', () => {
  it('adds and lists channels', () => {
    const mgr = new NotificationManager()
    mgr.addChannel(new ConsoleChannel())
    expect(mgr.getChannels()).toEqual(['console'])
  })

  it('removes channel by name', () => {
    const mgr = new NotificationManager()
    mgr.addChannel(new ConsoleChannel())
    mgr.removeChannel('console')
    expect(mgr.getChannels()).toEqual([])
  })

  it('sends notification to all channels', async () => {
    const mgr = new NotificationManager()
    const mockChannel: NotificationChannel = {
      name: 'mock',
      send: vi.fn().mockResolvedValue(undefined),
    }
    mgr.addChannel(mockChannel)
    await mgr.notify('trade_executed', 'Buy 005930', '삼성전자 1주 매수')
    expect(mockChannel.send).toHaveBeenCalledTimes(1)
    expect(mockChannel.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'trade_executed',
        title: 'Buy 005930',
        message: '삼성전자 1주 매수',
      })
    )
  })

  it('handles channel send failure gracefully', async () => {
    const mgr = new NotificationManager()
    const failChannel: NotificationChannel = {
      name: 'fail',
      send: vi.fn().mockRejectedValue(new Error('fail')),
    }
    const okChannel: NotificationChannel = {
      name: 'ok',
      send: vi.fn().mockResolvedValue(undefined),
    }
    mgr.addChannel(failChannel)
    mgr.addChannel(okChannel)
    await mgr.notify('error', 'Test', 'test')
    expect(okChannel.send).toHaveBeenCalledTimes(1)
  })
})

describe('ConsoleChannel', () => {
  it('sends notification without throwing', async () => {
    const channel = new ConsoleChannel()
    await expect(
      channel.send({
        type: 'trade_executed',
        title: 'Test',
        message: 'test message',
        timestamp: new Date(),
      })
    ).resolves.toBeUndefined()
  })
})

describe('WebhookChannel', () => {
  it('sends POST request to webhook URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    globalThis.fetch = fetchMock

    const channel = new WebhookChannel('https://hooks.example.com/test')
    await channel.send({
      type: 'trade_executed',
      title: 'Buy',
      message: 'bought stock',
      timestamp: new Date('2024-01-01T00:00:00.000Z'),
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://hooks.example.com/test',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      })
    )
    // cleanup done
  })
})
